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
  - From: https://nodered.org/docs/hardware/raspberrypi#raspbian
  - `bash <(curl -sL https://raw.githubusercontent.com/node-red/raspbian-deb-package/master/resources/update-nodejs-and-nodered)`
  - took about 26mins for me
- VNC Server -> Sign In to account
  - useful for connecting from VNC Connect client!
- Install EosRemote
  - follow / check my instructions!..
```shell
~ $ cd
~ $ git clone https://github.com/DaveThw/EosRemote.git
~ $ cd ~/EosRemote
~/EosRemote $ ln -sb $(pwd)/node-red/package.json ~/.node-red/
~/EosRemote $ ln -sb $(pwd)/node-red/settings.js ~/.node-red/
~/EosRemote $ ln -s $(pwd)/docs/ ~/www
~/EosRemote $ cd ~/.node-red
~/.node-red $ npm install
```
  - (`npm install` took approx. 13mins - serialport had to fallback-to-build, which threw up a bunch of warnings, but seemed to succeed! - npm also gave a couple of warnings that the project file doesn't have a licence or repository field...)
- Create SSL Certificate for HTTPS/WSS
  - for multiple IP addresses..?
```shell
pi@eosremote:~ $ cd ~/EosRemote
pi@eosremote:~/EosRemote $ mkdir ssl
pi@eosremote:~/EosRemote $ cd ssl/
pi@eosremote:~/EosRemote/ssl $ ls
openssl-csr.cnf

pi@eosremote:~/EosRemote/ssl $ openssl genrsa -out myCA.key 2048
Generating RSA private key, 2048 bit long modulus
.......................................+++
............................................+++
e is 65537 (0x010001)

pi@eosremote:~/EosRemote/ssl $ openssl req -x509 -sha256 -new -key myCA.key -out myCA.cer -days 365
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:UK
State or Province Name (full name) [Some-State]:.
Locality Name (eg, city) []:.
Organization Name (eg, company) [Internet Widgits Pty Ltd]:EosRemote
Organizational Unit Name (eg, section) []:LAN Server
Common Name (e.g. server FQDN or YOUR name) []:EosRemote - TRBSE
Email Address []:eosremote@dave.thwaites.org.uk

pi@eosremote:~/EosRemote/ssl $ openssl genrsa -out server.key 2048
Generating RSA private key, 2048 bit long modulus
.................+++
........................+++
e is 65537 (0x010001)

pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf
pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf
pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN Server, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf
pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN Server, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf
pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN Server, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf
pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -extfile v3.ext -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN Server, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ openssl x509 -req -sha256 -in server.csr -out server.cer -CAkey myCA.key -CA myCA.cer -extfile v3.ext -days 365 -CAcreateserial
Signature ok
subject=C = UK, O = EosRemote, OU = LAN Server, emailAddress = eosremote@dave.thwaites.org.uk, CN = eosremote
Getting CA Private Key

pi@eosremote:~/EosRemote/ssl $ cp server.key ~/.node-red/public/privatekey.pem
pi@eosremote:~/EosRemote/ssl $ cp server.cer ~/.node-red/public/certificate.pem
pi@eosremote:~/EosRemote/ssl $ cp myCA.cer ~/www
pi@eosremote:~/EosRemote/ssl $ ls
myCA.cer  myCA.key  myCA.srl  openssl-ca.cnf  openssl-csr.cnf  server.cer  server.csr  server.key  v3.ext

pi@eosremote:~/EosRemote/ssl $ cat openssl-csr.cnf 
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C=UK
#ST=Suffolk
#L=Bury St Edmunds
O=EosRemote
OU=LAN Server
emailAddress=eosremote@dave.thwaites.org.uk
CN = eosremote

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = eosremote
DNS.2 = eosremote.local
IP.1 = 192.168.1.2
IP.2 = 192.168.1.80

pi@eosremote:~/EosRemote/ssl $ cat v3.ext 
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = eosremote
DNS.2 = eosremote.local
IP.1 = 192.168.1.2
IP.2 = 192.168.1.80

pi@eosremote:~/EosRemote/ssl $ 

```

... to be continued!
