const oscmsg = require("osc-msg");
const net = require('net');
const websocket = require('ws');


/****************
 * OSC Over TCP *
 ****************/

// Port 3032 is the official OSC port
//  - only works if OSC is enabled in settings
// Port 3036 seems to be the port used by the aRFR / iRFR app
//  - always available
//  - updated more regularly that the OSC port (for things like running cue progress)
//  - seems to be fixed on OSC v.1.0 (non-SLIP encoding)



function sendOSC(soc, msg) {
    if (msg.args === undefined) {
      console.log("TCP: Sending OSC:", msg.address);
    } else {
      console.log("TCP: Sending OSC:", msg.address, "=", JSON.stringify(msg.args));
    }
    var oscMessage = oscmsg.encode(msg);
    // console.log(" Raw Message:", oscMessage);
    var len = oscMessage.length;
    var buf = new Buffer(len+4);
    buf[0] = (len>>24) & 255;
    buf[1] = (len>>16) & 255;
    buf[2] = (len>>8) & 255;
    buf[3] = len & 255;
    oscMessage.copy(buf,4);
    // console.log(" Raw Packet:", buf);
    soc.write(buf);
}

//setTimeout(function() {
//    sendOSC({
//        address: "/eos/key/1",
//        args: 1
////        args: [
////          { type: "integer", value: 1 }
////        ]
//    });
//}, 2000);

//setTimeout(function() {
//    sendOSC({
//        address: "/eos/key/1",
//        args: 0
////        args: [
////          { type: "integer", value: 0 }
////        ]
//    });
//}, 2500);


/*  Websocket message examples  *\

['id'] => request new client id
['id', <id>] => re-connect as client 'id'
['tick', [args]] => reply with ['tock', [args]]
['wol', <mac address>] => send one off magic packet
['wol', <mac address>, <delay>, <repeat count>] => send multiple magic packets
['wol', <mac address>, <delay>] => send endless magic packets
['wol', <mac address>, 'stop'] => stop sending magic packets
['ip-ping', <ip address>] => one off ping to ip address
['ip-ping', <ip address>, <delay>, <repeat count>] => repeated ping to <ip address>
['ip-ping', <ip address>, <delay>] => send endless pings to <ip address>
['ip-ping', <ip address>, 'stop'] => stop pinging <ip address>
['osc', 'open', <name>, 'tcp', <osc version>, <ip address>, <port>] =>
    create new TCP OSC connection to <ip address>, and name it 'name' for ease
    of reference in later messages...
['osc', 'open', <name>, 'udp', <osc version>, <local port>, <remote ip address>, <remote port>]
    set up new UDP OSC connection to <ip address>, and name it 'name' for ease
    of reference in later messages...
['osc', 'send', <name>, <osc object>] => send osc packet to <name>
['osc', 'close', <name>] => close the named connection
Creating an OSC connection adds further options to the <message type> list:
['ion', <osc object>] => send osc packet to Ion
    (shorthand for ['osc', 'send', 'ion', <osc object>] )
['qlab', <osc object>] => send osc packet to QLab

\* **************************** */


/*  Internal objects...  *\

Handlers = {
  id: function (client, args...),
  tick: function (client, args...),
  osc: function (client, args...),
  ...
}


Client = {
  websocket: <websocket>,
  id: <id-number>,
  handlers: -> use client.handlers = Object.create(Handlers)
}

clients = [ 0 => new Client(), ... ]


Id = {
  clients: [<client>, ...],
  timeout: null | Timeout object, from setTimeout, to close connections after websocket is closed
  osc: {
    eos: {
      transport: <tcp|udp>,
      version: <1.0|1.1>,
      ip: <ip address>,
      port: <port>,
      socket: <socket>
    }, ...
  }, ...
}

ids = [ 0 => new Id(), ... ]

\* ********************* */


// Main 'Handler' functions for messages received over the WebSocket:

var Handlers = {};

Handlers.id = function(client, args) {
    if (args === undefined) args = [];
    var previous_id = args[1];
    console.log("Id Message:");
    // check if previous_id is still a valid id (it may have timed-out)
    // - if not, treat it as 'undefined'...
    if ( previous_id !== undefined && ids[previous_id] === undefined ) {
      console.log(" Previous Id (no longer valid):", previous_id);
      previous_id = undefined;
    }
    if ( previous_id === undefined ) {
      console.log(" No Previous Id given");
      if (client.id === undefined) {
        console.log(" Client has no current Id - creating a new one");
        client.id = ids.length;
        ids.push(new Id(client.id, client));
        console.log(" Client Id:", client.id);
        // return new id number to WebSocket client...
        client.send([ 'id', client.id ]);
      } else {
        console.log(" Client has a current Id:", client.id);
        // return id number to WebSocket client...
      }
    } else {
      console.log(" Previous Id:", previous_id);
      if (client.id === undefined) {
        console.log(" Client has no current Id");
        client.id = previous_id;
        // return id number to WebSocket client...
      } else {
        console.log(" Client has a current Id:", client.id);
        // check if ids match
        // - if they are the same, then all good!
        // - if they aren't the same... then... leave the curreent id as it is..?
        // return id number to WebSocket client...
      }
    }
};

Handlers.osc = function(client, args) {
    if (args === undefined) args = [];
    var action = args[1];
    var name = args[2];
    var connection;
    console.log("OSC Message:");
    console.log(" Action:", action);
    console.log(" Name:", name);

    if ( client.id === undefined ) {
      console.log(" Client has no current Id - creating a new one");
      client.id = ids.length;
      ids.push(new Id(client.id, client));
      console.log(" Client Id:", client.id);
      // send new id number to WebSocket client...
      client.send([ 'id', client.id ]);
    }
    if ( ids[client.id].osc === undefined ) ids[client.id].osc = {};

    switch(action) {
      case 'open':
        if ( ids[client.id].osc[name] === undefined ) ids[client.id].osc[name] = {};
        else console.log(" OSC socket already exists...");
        connection = ids[client.id].osc[name];

        connection.transport = args[3];
        connection.osc_ver = args[4];
        connection.address = args[5];
        connection.port = args[6];

        // Ion: { host: '10.101.100.101', port: 3036 }
        connection.socket = net.createConnection( { host: connection.address, port: connection.port }, () => {
          // connection has been established
          console.log("TCP socket (WS:"+client.number+"): Connected to remote server:");
          console.log(" Remote Address:", connection.socket.remoteAddress + ", Port:", connection.socket.remotePort);
          console.log(" Local Address:", connection.socket.localAddress + ", Port:", connection.socket.localPort);
        });
        console.log(" Creating TCP socket...");

        connection.socket.on('close', () => {
          // connection has been closed
          console.log("TCP socket (WS:"+client.number+"): closed");
        });
    
        connection.socket.on('error', (err) => {
          // an error occurred
          console.log("TCP socket (WS:"+client.number+"): error:", err.message);
        });
    
        connection.socket.on('data', (message) => {
          console.log("TCP (WS:"+client.number+"): data package received:");
          // console.log("Raw Package:", message)

          var i=0;
          while (i < message.length) {
            var len = (message[i]<<24) + (message[i+1]<<16) + (message[i+2]<<8) + message[i+3];
            i += 4;
            // var buf = Buffer.allocUnsafe(len);
            var buf = new Buffer(len);
            message.copy(buf,0,i,i+len);
            // console.log(" Raw Packet:", buf);
            var oscMessage = oscmsg.decode(buf, { strict: true, strip: true, bundle: false });
            // console.log(" OSC Received:", oscMessage.address, '= "' + oscMessage.args.join('", "') + '"');
            // console.log(" OSC Received:", oscMessage.address, '=', JSON.stringify(oscMessage.args));
            // console.log(" OSC Received:", oscMessage.address, '=', oscMessage.args);
            client.send([ 'osc', 'receive', name, oscMessage ]);
            i += len;
          }
        });
        break;
      case 'send':
        if ( ids[client.id].osc[name] === undefined ) {
          console.log(" OSC socket doesn't exist...");
          break;
        }
        connection = ids[client.id].osc[name];

        if (connection.socket.writable) {
          sendOSC(connection.socket, args[3]);
        } else {
          console.log(" TCP socket (WS:"+client.number+"): not writable at the moment...");
        }
        break;
      case 'close':
        if ( ids[client.id].osc[name] === undefined ) {
          console.log(" OSC socket doesn't exist...");
          break;
        }
        connection = ids[client.id].osc[name];
        
        console.log(" Closing OSC socket...");
        connection.socket.end();
        break;
    }
};



function Client(number, ws) {
  this.number = number;
  this.websocket = ws;
  this.id = undefined;
  this.handlers = Object.create(Handlers);
  this.send = function() {
    this.websocket.send(JSON.stringify(arguments));
  };
}

clients = [];



function Id(id, client) {
  this.id = id;
  this.clients = [];
  if ( client !== undefined ) {
    this.clients.push(client);
  }
  this.timeout = null;
}

ids = [];




var wss = new websocket.Server({
    // host: "10.101.1.2",
    host: "192.168.1.2",
    port: 8081,
}, function () {
    let { port, family, address } = wss.address();
    console.log("WebSocket Server: listening for connections:", address + ":" + port);
});

wss.on('close', () => {
    // connection was closed
    console.log("WebSocket Server: closed");
});

wss.on('error', (err) => {
    // an error occurred
    console.log("WebSocket Server: error:", err);
});

wss.on('connection', function (ws, req) {
    console.log("WebSocket Server: new connection:");
    console.log(" Client:", req.connection.remoteAddress);
    // see: https://stackoverflow.com/questions/14822708/how-to-get-client-ip-address-with-websocket-websockets-ws-library-in-node-js
    var client = new Client(clients.length, ws);
    clients.push(client);
    console.log(" WS number:", client.number);

    ws.on('close', () => {
      // connection was closed
      console.log("WebSocket ("+client.number+"): closed");
      // console.log(" Ending TCP socket...");
      // ws.socket.end();
      delete clients[client.number];
    });

    ws.on('error', (err) => {
      // an error occurred
      console.log("WebSocket ("+client.number+"): error:", err);
    });

    ws.on('message', function incoming(message) {
      console.log("WebSocket ("+client.number+"): message received:", message);
      message = JSON.parse(message);
      if ( client.handlers[message[0]] !== undefined) {
        client.handlers[message[0]](client, message);
      }
      
      //if (ws.socket.writable) {
      //  sendOSC(ws.socket, JSON.parse(message));
      //} else {
      //  console.log(" TCP socket (WS:"+client.number+"): not writable at the moment...");
      //}
    });

});


process.on('SIGINT', function() {
    // let's shut everything down!
    console.log();
    console.log("SIGINT Received - Shutting down...");
    console.log("Total count of WebSocket Clients connected:", clients.length);
    console.log("Checking Clients list...");
    clients.forEach(function(client, index){
      switch (client.websocket.readyState) {
        case websocket.CONNECTING:
          console.log(" WebSocket "+client.number+": Connecting");
          break;
        case websocket.OPEN:
          console.log(" WebSocket "+client.number+": Open");
          break;
        case websocket.CLOSING:
          console.log(" WebSocket "+client.number+": Closing");
          break;
        case websocket.CLOSED:
          console.log(" WebSocket "+client.number+": Closed");
          break;
        default:
          console.log(" WebSocket "+client.number+": Unknown state ("+client.websocket.readyState+")");
      }
/*
      if (ws.socket !== undefined) {
        if (ws.socket.pending) {
          console.log("  TCP Socket: Pending");
        } else if (ws.socket.connecting) {
          console.log("  TCP Socket: Connecting");
        } else if (ws.socket.destroyed) {
          console.log("  TCP Socket: Destroyed");
        } else {
          console.log("  TCP Socket: Open");
        }
        if ( ws.socket.bytesRead !== undefined || ws.socket.bytesWritten !== undefined ) {
          console.log("   Bytes Read / Written:", ws.socket.bytesRead, "/", ws.socket.bytesWritten);
        }
        if ( ws.socket.localAddress !== undefined || ws.socket.localPort !== undefined ) {
          console.log("   Local Address:", ws.socket.localAddress + ":" + ws.socket.localPort );
        }
        if ( ws.socket.remoteAddress !== undefined || ws.socket.remotePort !== undefined ) {
          console.log("   Remote Address:", ws.socket.remoteAddress + ":" + ws.socket.remotePort);
        }
      }
*/
      if (client.websocket.readyState == websocket.CONNECTING || client.websocket.readyState == websocket.OPEN) {
        console.log("  Closing WebSocket...");
        client.websocket.close();
      }
    });
    console.log("Closing WebSocket Server...");
    wss.close(function() {
      console.log("Exiting...");
      process.exit();
    });
});