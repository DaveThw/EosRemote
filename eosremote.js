const oscmsg = require("osc-msg");
const net = require('net');


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

    console.log("Connected to remote OSC Server, via TCP:");
    console.log(" Remote Address:", socket.remoteAddress + ", Port:", socket.remotePort);
});

socket.on('close', () => {
  // connection was closed
    console.log("OSC/TCP socket closed");
});

socket.on('error', (err) => {
  // an error occurred
    console.log("OSC/TCP socket error:", err);
});

socket.on('data', (message) => {
    console.log("OSC Package received:")
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
      i += len;
    }

})



function sendOSC(msg) {
    console.log("Sending OSC:", msg.address, "=", msg.args);
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

setTimeout(function() {
    sendOSC({
        address: "/eos/key/1",
        args: 1
//        args: [
//          { type: "integer", value: 1 }
//        ]
    });
}, 2000);

setTimeout(function() {
    sendOSC({
        address: "/eos/key/1",
        args: 0
//        args: [
//          { type: "integer", value: 0 }
//        ]
    });
}, 2500);
