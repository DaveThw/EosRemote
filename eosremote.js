var osc = require("osc");

/****************
 * OSC Over TCP *
 ****************/

var getIPAddresses = function () {
    var os = require("os"),
        interfaces = os.networkInterfaces(),
        ipAddresses = [];

    for (var deviceName in interfaces) {
        var addresses = interfaces[deviceName];
        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];
            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};



var tcpSocketPort = new osc.TCPSocketPort({
//    localAddress: "0.0.0.0",
//    localPort: 57121,
    address: "10.101.100.101",
    // Port 3032 is the official OSC port - only works if OSC is enabled in settings
    //port: 3032,
    // Port 3036 seems to be the port used by the aRFR / iRFR app
    //  - always available
    //  - updated more regularly that the OSC port (for things like running cue progress)
    //  - seems to be fixed on OSC v.1.0 (non-SLIP encoding)
    port: 3036,
    useSLIP: false
});



//console.log("TCP Socket Port 'data' listeners:", tcpSocketPort.listeners('data'));

//tcpSocketPort.removeListener("data", osc.SLIPPort.decodeOSC);
//tcpSocketPort.removeListener("data", tcpSocketPort.decodeOSC);
//tcpSocketPort.removeListener("data", osc.Port.prototype.decodeOSC);
tcpSocketPort.removeAllListeners("data");

//console.log("TCP Socket Port 'data' listeners:", tcpSocketPort.listeners('data'));

tcpSocketPort.on("data", function (data, packetInfo) {
    data = osc.byteArray(data);
    this.emit("raw", data, packetInfo);

    console.log("OSC Packet(s) Received");
    // console.log("Raw OSC:", data);

    try {

        var i=0;
        while (i < data.byteLength) {
            var len = (data[i]<<24) + (data[i+1]<<16) + (data[i+2]<<8) + data[i+3];
            i += 4;

            var packet = osc.readPacket(data, this.options, { idx: i }, len);
            this.emit("osc", packet, packetInfo);
            osc.firePacketEvents(this, packet, undefined, packetInfo);

            i += len;
        }
    } catch (err) {
        this.emit("error", err);
    }
});

// console.log("TCP Socket Port 'data' listeners:", tcpSocketPort.listeners('data'));



tcpSocketPort.on("ready", function () {
    var ipAddresses = getIPAddresses();

    console.log("Listening for OSC over TCP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", tcpSocketPort.options.localPort);
    });
    console.log(" Remote:", tcpSocketPort.options.address + ", Port:", tcpSocketPort.options.port);
});



tcpSocketPort.on("message", function (oscMessage) {
    // console.log("OSC Received:", oscMessage);
    console.log(" OSC Received:", oscMessage.address, '= "' + oscMessage.args.join('", "') + '"');
});



tcpSocketPort.on("error", function (err) {
    console.log(err);
});



// Port 3032 is the official OSC port - only works if OSC is enabled in settings
// tcpSocketPort.open("10.101.100.101", 3032);
// Port 3036 seems to be the port used by the aRFR / iRFR app - always available 
// tcpSocketPort.open("10.101.100.101", 3036);
tcpSocketPort.open();



setTimeout(function() {
    var msg = {
        address: "/eos/key/0",
        args: [
            {
                type: "i",
                value: 1
            }
        ]
    };

    console.log("Sending message", msg.address, msg.args, "to", tcpSocketPort.options.address + ":" + tcpSocketPort.options.port);
    tcpSocketPort.send(msg);
}, 2000);

setTimeout(function() {
    var msg = {
        address: "/eos/key/0",
        args: [
            {
                type: "i",
                value: 0
            }
        ]
    };

    console.log("Sending message", msg.address, msg.args, "to", tcpSocketPort.options.address + ":" + tcpSocketPort.options.port);
    tcpSocketPort.send(msg);
}, 2500);