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
['osc', 'close', <name>] => close the named connection
Creating an OSC connection adds further options to the <message type> list:
['ion', <binary coded osc>] => send osc packet to Ion
['qlab', <binary coded osc>] => send osc packet to QLab

\* **************************** */

/*
var WSmsg = {
    osc: function(client, action, name) {
        switch(action) {
            case 'open':
                break;
            case 'close':
                break;
        }
    }
};
*/

/*
class Client {
    handlers;
    id;
    constructor() {
        this.handlers = {};
        this.handlers.osc = function(that, args) {
            switch(args[0]) {
                case 'id':
                    that.id = id;
                    break;
                case 'open':
                    // args[0] = 'open'
                    // args[1] = 'osc' / 'wol' / 'ping' / ...
                    // osc: args[2] = name for osc connection
                    // osc: args[3] = 'tcp' / 'udp'
                    // osc: args[4] = osc version: '1.0' / '1.1'
                    // osc: args[5] = ip address
                    // osc: args[6] = port
                    // wol: args[2] = mac address
                    // wol: args[3] = number of times to repeat magic packet
                    // wol: args[4] = delay between magic packets
                    // ping: args[2] = ip address
                    // ping: args[3] = delay between pings?
                    break;
        }
    };
}
*/



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

// var webs = null;
var ws_id = 0;
var ws_list = [];
const dead_ws = { readyState: -1 };

wss.on('connection', function (ws, req) {
    console.log("WebSocket Server: new connection:");
    console.log(" Client:", req.connection.remoteAddress);
    // see: https://stackoverflow.com/questions/14822708/how-to-get-client-ip-address-with-websocket-websockets-ws-library-in-node-js
    ws.id = ++ws_id;
    ws_list[ws.id] = ws;
    console.log(" Id:", ws.id);

    ws.on('close', () => {
      // connection was closed
      console.log("WebSocket ("+ws.id+"): closed");
      console.log(" Ending TCP socket...");
      ws.socket.end();
      ws_list[ws.id] = dead_ws;
    });

    ws.on('error', (err) => {
      // an error occurred
      console.log("WebSocket ("+ws.id+"): error:", err);
    });

    ws.on('message', function incoming(message) {
      console.log("WebSocket ("+ws.id+"): message received:", message);
      sendOSC(ws.socket, JSON.parse(message));
    });


    ws.socket = net.createConnection( { host: '10.101.100.101', port: 3036 }, () => {
      // connection was established
    
        console.log("TCP socket (WS:"+ws.id+"): Connected to remote server:");
        console.log(" Remote Address:", ws.socket.remoteAddress + ", Port:", ws.socket.remotePort);
        console.log(" Local Address:", ws.socket.localAddress + ", Port:", ws.socket.localPort);
    });

    ws.socket.on('close', () => {
      // connection was closed
        console.log("TCP socket (WS:"+ws.id+"): closed");
    });
    
    ws.socket.on('error', (err) => {
      // an error occurred
        console.log("TCP socket (WS:"+ws.id+"): error:", err);
    });
    
    ws.socket.on('data', (message) => {
        console.log("TCP (WS:"+ws.id+"): data package received:");
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
          ws.send(JSON.stringify(oscMessage));
          i += len;
        }
    
    });


});


process.on('SIGINT', function() {
    // let's shut everything down!
    console.log();
    console.log("SIGINT Received - Shutting down...");
    console.log("Total count of WebSockets connected:", ws_id);
    console.log("Checking WebSockets...");
    ws_list.forEach(function(ws, index){
      switch (ws.readyState) {
        case websocket.CONNECTING:
          console.log(" WebSocket "+ws.id+": Connecting");
          break;
        case websocket.OPEN:
          console.log(" WebSocket "+ws.id+": Open");
          break;
        case websocket.CLOSING:
          console.log(" WebSocket "+ws.id+": Closing");
          break;
        case websocket.CLOSED:
          console.log(" WebSocket "+ws.id+": Closed");
          break;
        case -1:
          console.log(" WebSocket "+index+": Dead");
          break;
        default:
          console.log(" WebSocket "+ws.id+": Unknown state ("+ws.readyState+")");
      }
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
      if (ws.readyState == websocket.CONNECTING || ws.readyState == websocket.OPEN) {
        console.log("  Closing WebSocket...");
        ws.close();
      }
    });
    console.log("Closing WebSocket Server...");
    wss.close(function() {
      console.log("Exiting...");
      process.exit();
    });
});