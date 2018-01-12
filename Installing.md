# Notes on how to install / set up

- Clone from GitHub:
  ``` shell
  ~ $ cd
  ~ $ git clone https://github.com/DaveThw/EosRemote.git
  ```
  Or download from GitHub:
  ``` shell
  ~ $ cd
  ~ $ wget -O EosRemote.zip https://github.com/DaveThw/EosRemote/archive/master.zip
  ~ $ unzip EosRemote.zip
  ~ $ mv EosRemote-master EosRemote
  ```
- Install/upgrade/update node-red (if not yet done...) - see <https://nodered.org/docs/hardware/raspberrypi>
  ``` shell
  ~ $ bash <(curl -sL https://raw.githubusercontent.com/node-red/raspbian-deb-package/master/resources/update-nodejs-and-nodered)
  ```
- Remove original node-red files (maybe back-up..?)
  ``` shell
  ~ $ rm ~/.node-red/package.json 
  ~ $ rm ~/.node-red/settings.js 
  ```
- Link our node-red config files - could use -b option to ask ln to backup the originals:
  ``` shell
  ~ $ cd ~/EosRemote
  ~/EosRemote $ ln -s $(pwd)/node-red/package.js ~/.node-red/
  ~/EosRemote $ ln -s $(pwd)/node-red/settings.js ~/.node-red/
  ```
- Link root web directory:
  ``` shell
  ~/EosRemote $ ln -s $(pwd)/docs/ ~/www
  ```
- Use npm to install necessary node-red nodes, as listed in node-red/package.js (*a bit of guess work here* - **untested**)
  ``` shell
  ~/EosRemote $ cd ~/.node-red
  ~/.node-red $ npm install
  ```
- Set node-red to auto-start on bootup
  ``` shell
  ~/.node-red $ cd
  ~ $ sudo systemctl enable nodered.service
  ```
- Create a Certificate Authority, a Private Key and a Certificate, for Node-Red to use HTTPS/WSS
  - See notes here: [Securing Node-Red - Create Certificates](https://davethw.github.io/theatre-royal/eos-remote/securing-nodered.html#create-certificates-for-node-red-to-use)
- Install new Certificate Authority on devices that might need access without HTTPS/WSS errors!
  - See: [Securing Node-Red - Install Certificate Authority](https://davethw.github.io/theatre-royal/eos-remote/securing-nodered.html#install-our-certificate-authority-certificate-on-any-devices-necessary)
- Connect the ethernet port on the Raspberry Pi to the lighting network
  - Better to use an ethernet connection, rather than wifi, for reliability and speed - but might work with wifi if necessary
  - Probably useful to allocate a fixed IP address - I've used 10.101.1.2
- If wanted, plug a wifi dongle into the Raspberry Pi to connect to a separate network (maybe with internet access...)
  - Again, probably useful to allocate a fixed IP address - I've used 192.168.1.2
  - You'll probably need to tweak some network metrics to make internet access work - see here: [Network Metrics](https://davethw.github.io/theatre-royal/eos-remote/network-metrics.html)
- In theory it might be useful/nice to give the Raspberry Pi a nice hostname ('eosremote', for example!) - however I generally haven't managed to use this hostname to access the Raspberry Pi so far, so this may need some work...
  - Go the the Application Menu -> Preferences -> Raspberry Pi Configuration -> System -> Hostname
- Start node-red!
  ``` shell
  ~ $ node-red-start
  ```

## Then, to access the Web App
- The EosRemote Web App can be found at something like: <https://192.168.1.2:1880>
- Or alternatively, using the current GitHub code: <https://davethw.github.io/EosRemote/?server=192.168.1.2&port=1880> - if you haven't installed the Certificate Authority the WebSocket may fail to connect - you won't see any security warnings, except in the Console (within Developer Tools)
- And the Node-RED interface can be found at: <https://192.168.1.2:1880/node-red/>
