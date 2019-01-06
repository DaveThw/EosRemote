const oscmsg = require("osc-msg");
const net = require('net');
const WS = require('ws');
WS.states = ["Connecting", "Open", "Closing", "Closed"];

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

['id'] => request new connections id
['id', <id>] => re-connect to connections 'id'
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
  number: <index>,
  websocket: <websocket>,
  connections: <connections>,
  handlers: -> use client.handlers = Object.create(Handlers)
}
Client.list = [ 0 => new Client(), ... ]


Connections = {
  id: <index>,
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
Connections.list = [ 0 => new Connections(), ... ]

\* ********************* */


// Main 'Handler' functions for messages received over the WebSocket:

var Handlers = {};

Handlers.id = function(client, args) {
    if (args === undefined) args = [];
    var previous_id = args[1];
    console.log("Id Message:");
    // check if previous_id is still a valid connections id (it may have timed-out)
    // - if not, treat it as 'undefined'...
    if ( previous_id !== undefined && Connections.list[previous_id] === undefined ) {
      console.log(" Previous Connections id (no longer valid):", previous_id);
      previous_id = undefined;
    }
    if ( previous_id === undefined ) {
      console.log(" No previous Connections id");
      if (client.connections === undefined) {
        console.log(" Client has no Connections attribute - creating a new one");
        client.connect();
        console.log(" Client Connections id:", client.connections.id);
        // return new connections id number to WebSocket client...
        client.send([ 'id', client.connections.id ]);
      } else {
        console.log(" Client already has a Connections attribute, id:", client.connections.id);
        // return connections id number to WebSocket client...
        client.send([ 'id', client.connections.id ]);
      }
    } else {
      console.log(" Previous Connections id:", previous_id);
      if (client.connections === undefined) {
        console.log(" Client has no Connections attribute - linking to previous one");
        client.reconnect(previous_id);
        // return id number to WebSocket client...
        client.send([ 'id', client.connections.id ]);
      } else {
        console.log(" Client already has a Connections attribute, id:", client.connections.id);
        // check if ids match
        // - if they are the same, then all good!
        // - if they aren't the same... then... leave the curreent id as it is..?
        // return id number to WebSocket client...
        client.send([ 'id', client.connections.id ]);
      }
    }
};

Handlers.osc = function(client, args) {
    if (args === undefined) args = [];
    var action = args[1];
    var name = args[2];
    console.log("OSC Message:");
    console.log(" Action:", action);
    console.log(" Name:", name);

    if ( client.connections.id === undefined ) {
      console.log(" Client doesn't have a Connections attribute - creating a new one");
      client.connect();
      console.log(" Client Connections id:", client.connections.id);
      // send new id number to WebSocket client...
      client.send([ 'id', client.connections.id ]);
    }
    if ( client.connections.osc === undefined ) client.connections.osc = {};
    var connection = client.connections.osc[name];

    switch(action) {
      case 'open':
        if ( connection === undefined ) connection = client.connections.osc[name] = {};
        else console.log(" OSC(TCP) connection already exists...");

        connection.transport = args[3];
        connection.osc_ver = args[4];
        connection.address = args[5];
        connection.port = args[6];

        // Ion: { host: '10.101.100.101', port: 3036 }
        connection.socket = net.createConnection( { host: connection.address, port: connection.port }, () => {
          // connection has been established
          console.log("OSC(TCP) socket (Client:"+client.number+"/Conn:"+client.connections.id+"): Connected to remote server:");
          console.log(" Remote Address:", connection.socket.remoteAddress + ", Port:", connection.socket.remotePort);
          console.log(" Local Address:", connection.socket.localAddress + ", Port:", connection.socket.localPort);
        });
        console.log(" Creating OSC(TCP) socket...");

        connection.socket.on('close', () => {
          // connection has been closed
          console.log("OSC(TCP) socket (Client:"+client.number+"/Conn:"+client.connections.id+"): closed");
        });
    
        connection.socket.on('error', (err) => {
          // an error occurred
          console.log("OSC(TCP) socket (Client:"+client.number+"/Conn:"+client.connections.id+"): error:", err.message);
        });
    
        connection.socket.on('data', (message) => {
          console.log("OSC(TCP) (Client:"+client.number+"/Conn:"+client.connections.id+"): data package received:");
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
        if ( connection === undefined ) {
          console.log(" OSC(TCP) socket doesn't exist...");
          break;
        }

        if (connection.socket.writable) {
          sendOSC(connection.socket, args[3]);
        } else {
          console.log(" OSC(TCP) socket (Client:"+client.number+"/Conn:"+client.connections.id+"): not writable at the moment...");
        }
        break;
      case 'close':
        if ( connection === undefined ) {
          console.log(" OSC(TCP) socket doesn't exist...");
          break;
        }

        console.log(" Closing OSC(TCP) socket...");
        connection.socket.end();
        break;
    }
};



function Client(ws) {
    this.number = Client.list.length;
    this.websocket = ws;
    this.connections = undefined;
    this.handlers = Object.create(Handlers);
    Client.list.push(this);
}
Client.list = [];
Client.prototype.send = function() {
    if (this.websocket.readyState == WS.OPEN) {
      // console.log("Sending message - WebSocket "+this.number);
      this.websocket.send(JSON.stringify(arguments));
    } else {
      console.log("Unable to send message - WebSocket "+this.number+":", this.websocket_status());
    }
};
Client.prototype.websocket_status = function() {
    if ( this.websocket ) {
      if ( WS.states[this.websocket.readyState] ) {
        return WS.states[this.websocket.readyState];
      } else {
        return "Unknown state (" + WS.states[this.websocket.readyState] + ")";
      }
    } else {
      return "No WebSocket defined!";
    }
};
Client.prototype.connect = function() {
    console.log("Creating new Connections for Client:", this.number);
    this.connections = new Connections(this);
    console.log(" Connections, id:", this.connections.id);
};
Client.prototype.reconnect = function(id) {
    console.log("Reconnecting Client:", this.number);
    if ( id === undefined ) {
      console.log(" Error: No Connections id supplied!..");
      return;
    }
    if ( Connections.list[id] === undefined ) {
      console.log(" Error: Connections id not valid:", id);
      return;
    }
    if ( this.connections ) {
      console.log(" Removing old Connections, id:", this.connections.id);
      this.connections.remove_client(this);
    }
    console.log(" Connecting Client "+this.number+" to Connections id:", id);
    this.connections = Connections.list[id].add_client(this);
};
Client.prototype.remove = function() {
    console.log("Removing Client:", this.number);
    if (this.websocket.readyState == WS.CONNECTING || this.websocket.readyState == WS.OPEN) {
      console.log(" Closing WebSocket...");
      this.websocket.close();
    }
    if ( this.connections ) {
      // console.log(" Connections id:", this.connections.id);
      this.connections.remove_client(this);
    };
    delete Client.list[this.number];
}



function Connections(client) {
    this.id = Connections.list.length;
    this.clients = [];
    this.timeout = null;
    Connections.list.push(this);
    if (client) this.add_client(client);
}
Connections.list = [];
Connections.prototype.add_client = function(client) {
    this.clients.push(client);
    return this;
};
Connections.prototype.remove_client = function(client) {
    let index = this.clients.indexOf(client);
    if ( index >= 0 ) {
      console.log("Removing Client "+client.number+" from Connections id "+this.id);
    } else {
      console.log("Unable to remove Client "+client.number+" from Connections id "+this.id+" - not found");
    }
};




var wss = new WS.Server({
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
    var client = new Client(ws);
    console.log(" Client number:", client.number);

    ws.on('close', () => {
      // connection was closed
      console.log("WebSocket (Client:"+client.number+"): closed");
      // console.log(" Ending TCP socket...");
      // ws.socket.end();
      client.remove();
    });

    ws.on('error', (err) => {
      // an error occurred
      console.log("WebSocket (Client:"+client.number+"): error:", err);
    });

    ws.on('message', function incoming(message) {
      console.log("WebSocket (Client:"+client.number+"): message received:", message);
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
    console.log("Total count of WebSocket Clients connected:", Client.list.length);
    console.log("Checking Clients list...");
    Client.list.forEach(function(client, index){
      console.log("Client "+client.number+" exists");
      console.log(" WebSocket:", client.websocket_status());
      client.remove();
    });
    console.log("Total count of Connections objects connected:", Connections.list.length);
    console.log("Checking Connections list...");
    Connections.list.forEach(function(connection, index){
      console.log("Connection "+connection.id+" exists");
      let socket = connection.osc.eos.socket;
      if (socket !== undefined) {
        if (socket.pending) {
          console.log(" OSC/TCP Socket: Pending");
        } else if (socket.connecting) {
          console.log(" OSC/TCP Socket: Connecting");
        } else if (socket.destroyed) {
          console.log(" OSC/TCP Socket: Destroyed");
        } else {
          console.log(" OSC/TCP Socket: Open");
        }
        if ( socket.bytesRead !== undefined || socket.bytesWritten !== undefined ) {
          console.log("  Bytes Read / Written:", socket.bytesRead, "/", socket.bytesWritten);
        }
        if ( socket.localAddress !== undefined || socket.localPort !== undefined ) {
          console.log("  Local Address:", socket.localAddress + ":" + socket.localPort );
        }
        if ( socket.remoteAddress !== undefined || socket.remotePort !== undefined ) {
          console.log("  Remote Address:", socket.remoteAddress + ":" + socket.remotePort);
        }
        console.log("  Ending OSC/TCP Socket...");
        socket.end();
      }
    });
    console.log("Closing WebSocket Server...");
    wss.close(function() {
      console.log("Exiting...");
      process.exit();
    });
});