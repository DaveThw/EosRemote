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
var socket = net.createConnection( { host: '10.101.100.101', port: 3036 }, () => {
  // connection was established

    console.log("TCP Connected to remote OSC Server:");
    console.log(" Remote Address:", socket.remoteAddress + ", Port:", socket.remotePort);
});

socket.on('close', () => {
  // connection was closed
    console.log("TCP socket closed");
});

socket.on('error', (err) => {
  // an error occurred
    console.log("TCP socket error:", err);
});

socket.on('data', (message) => {
    console.log("TCP: OSC Package received:")
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
      console.log(" OSC Received:", oscMessage.address, '= "' + oscMessage.args.join('", "') + '"');
      // console.log(" OSC Received:", oscMessage.address, '=', oscMessage.args);
      if ( webs ) {
        webs.send(JSON.stringify(oscMessage));
      }
      i += len;
    }

})



function sendOSC(msg) {
    console.log("TCP: Sending OSC:", msg.address, "=", msg.args);
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
    socket.write(buf);
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




var wss = new websocket.Server({
    // host: "10.101.1.2",
    host: "192.168.1.2",
    port: 8081,
}, function () {
    let { port, family, address } = wss.address();
    console.log("WebSocket Server is listening for connections:", address + ":" + port);
});

wss.on('close', () => {
  // connection was closed
    console.log("WebSocket Server closed");
});

wss.on('error', (err) => {
  // an error occurred
    console.log("WebSocket Server error:", err);
});

var webs = null;

wss.on('connection', function (ws, req) {
    console.log("A WebSocket connection has been established: client:", req.connection.remoteAddress);
    // see: https://stackoverflow.com/questions/14822708/how-to-get-client-ip-address-with-websocket-websockets-ws-library-in-node-js

    ws.on('close', () => {
      // connection was closed
      console.log("WebSocket closed");
      webs = null;
    });

    ws.on('error', (err) => {
      // an error occurred
      console.log("WebSocket error:", err);
    });

    ws.on('message', function incoming(message) {
      console.log('WebSocket: message received:', message);
      sendOSC(JSON.parse(message));
    });

    webs = ws;
});