var OSC = require("osc-js");
var TCPClientPlugin = require('./tcpclient');
// var TCPClient = require('./tcpclient');
// var TCPClientPlugin = TCPClient.TCPClientPlugin;

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


const osc = new OSC({
  discardLateMessages: false, /* ignores messages which timetags lie in the past */
  plugin: new TCPClientPlugin( { host: '10.101.100.101', port: 3036 } ), /* plugin for network communication */ 
});

osc.on('open', () => {
  // connection was established
    var ipAddresses = getIPAddresses();

    console.log("Listening for OSC over TCP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", tcpSocketPort.options.localPort);
    });
    console.log(" Remote:", tcpSocketPort.options.address + ", Port:", tcpSocketPort.options.port);
});

osc.on('close', () => {
  // connection was closed
    console.log("OSC/TCP socket closed");
});

osc.on('error', (err) => {
  // an error occurred
    console.log(err);
});

osc.on('*', message => {
    console.log("OSC Message:", message.args); // prints the message arguments
});

osc.open();