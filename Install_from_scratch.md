# Notes on how to install / set up a Raspberry Pi, from scratch!

(Working on a Raspberry Pi 1, using March 2018 [Raspbian Image](https://www.raspberrypi.org/downloads/raspbian/) (release date: 2018-03-13), doing the set-up on 2018-03-21)

- Flash latest [Raspbian Image](https://www.raspberrypi.org/downloads/raspbian/) onto an SD card (tested using the March 2018 image) - [see here for notes about doing it on a Chromebook](https://davethw.github.io//theatre-royal/eos-remote/Flashing-RaspberryPi-Image.html)
- Boot up the Raspberry Pi - you'll need a monitor and mouse connected, maybe also a keyboard
- From the Applications menu, choose Preferences -> Raspberry Pi Configuration
  - Under Interfaces, turn on (SSH and) VNC
  - Under System, choose a fixed resolution (if you want to connect with VNC, without a monitor connected) - maybe CEA mode 4 1280x720..?
  - It's also useful to Disable Underscan for VNC, as Underscan just reduces the resolution of the display (1280x720 becomes 1184x624!)
  - Reboot
- You should now be able to connect using VNC to the Pi's IP address, display 0 - eg 192.168.1.80:0 - and you should therefore be able to disconnect the monitor and mouse (and keyboard) if you wish, and complete the rest of the setup remotely.
- SSH will warn you that you haven't changed the default password for the 'pi' user - this is a security risk!
  - Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Change Password
- sudo apt update && sudo apt upgrade - upgrade took about 15mins for me
- Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Hostname
  - eosremote
  - Reboot
- Maybe look at Applications menu -> Preferences -> Raspberry Pi Configuration -> Localisation
  - Locale: en / GB / UTF-8
  - Timezone: GB
  - Keyboard: United Kingdom - English (UK)
  - WiFi Country: GB Britain (UK)
- Node-RED Update
  - took about 26mins for me
- VNC Server -> Sign In to account



- Install EosRemote
  - follow / check my instructions!..
- Create SSL Certificate for HTTPS/WSS
  - for multiple IP addresses..?

... to be continued!
