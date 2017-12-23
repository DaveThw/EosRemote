# Notes on how to install / set up

- Clone from GitHub:
  ``` shell
  ~ $ cd
  ~ $ git clone https://github.com/DaveThw/EOSRemote.git
  ```
  Or download from GitHub:
  ``` shell
  ~ $ cd
  ~ $ wget -O EOSRemote.zip https://github.com/DaveThw/EOSRemote/archive/master.zip
  ~ $ unzip EOSRemote.zip
  ~ $ mv EOSRemote-master EOSRemote
  ```
- Install/upgrade/update node-red (if not yet done...) - see [nodered.org/docs/hardware/raspberrypi](https://nodered.org/docs/hardware/raspberrypi)
  ``` shell
  ~ $ bash <(curl -sL https://raw.githubusercontent.com/node-red/raspbian-deb-package/master/resources/update-nodejs-and-nodered)
  ```
- Remove original node-red files (maybe back-up..?)
  ``` shell
  ~ $ rm ~/.node-red/package.json 
  ~ $ rm ~/.node-red/settings.js 
  ~ $ rm ~/.node-red/flows_oscbridge.json 
  ```
- Link our node-red config files - could use -b option to ask ln to backup the originals:
  ``` shell
  ~ $ cd ~/EOSRemote
  ~/EOSRemote $ ln -s $(pwd)/node-red/package.js ~/.node-red/
  ~/EOSRemote $ ln -s $(pwd)/node-red/settings.js ~/.node-red/
  ~/EOSRemote $ ln -s $(pwd)/node-red/flows.json ~/.node-red/flows_$(hostname).json
  ```
  - Note: This doesn't totally work - if you update anything on node-red, it appears that it deletes the old backup, **renames** the current flows file as the backup, and saves the new flows in a new file (with the same name) - this means that we wind up with the backup being linked back to our node-red directory after one change, and then no link after two changes...  Not the end of the world for deployment, but a bit annoying for developemnt...  Maybe look at changing the userDir option in the setting.js file..?
- Link root web directory:
  ``` shell
  ~/EOSRemote $ ln -s $(pwd)/docs/ ~/www
  ```
- Use npm to install necessary node-red nodes, as listed in node-red/package.js (*a bit of guess work here* - **untested**)
  ``` shell
  ~/EOSRemote $ cd ~/.node-red
  ~/.node-red $ npm install
  ```
- Set node-red to auto-start on bootup
  ``` shell
  ~/.node-red $ cd
  ~ $ sudo systemctl enable nodered.service
  ```
- Start node-red!
  ``` shell
  ~ $ node-red-start
  ```
- Create / Install CA on devices that might need access without HTTPS errors...
- The EOSRemote web-app can be found at something like: [https://192.168.1.2:1880](https://192.168.1.2:1880)
- And the Node-RED interface can be found at: [https://192.168.1.2:1880/node-red/](https://192.168.1.2:1880/node-red/)
