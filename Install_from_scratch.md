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
- Have a go at creating a private Certificate Authority:
``` shell
pi@eosremote:~/EosRemote/ssl $ mkdir CA
pi@eosremote:~/EosRemote/ssl $ mkdir CA/private
pi@eosremote:~/EosRemote/ssl $ mkdir CA/certs
pi@eosremote:~/EosRemote/ssl $ mkdir CA/crl
pi@eosremote:~/EosRemote/ssl $ mkdir CA/newcerts

pi@eosremote:~/EosRemote/ssl $ openssl req -x509 -new -nodes -out ./CA/cacert.pem -days 3653 -config openssl-ca.cnf
Generating a 2048 bit RSA private key
.................................................................................................................................................................................................................................+++
.....................+++
writing new private key to '/home/pi/EosRemote/ssl/CA/private/cakey.pem'
-----

pi@eosremote:~/EosRemote/ssl $ openssl x509 -in ./CA/cacert.pem -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            cf:18:37:cc:57:cd:8a:e0
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = UK, ST = Suffolk, L = Bury St Edmunds, O = EosRemote, OU = https://github.com/DaveThw/EosRemote/, emailAddress = eosremote@dave.thwaites.org.uk, CN = EosRemote Root CA
        Validity
            Not Before: Apr 14 07:15:47 2018 GMT
            Not After : Apr 14 07:15:47 2028 GMT
        Subject: C = UK, ST = Suffolk, L = Bury St Edmunds, O = EosRemote, OU = https://github.com/DaveThw/EosRemote/, emailAddress = eosremote@dave.thwaites.org.uk, CN = EosRemote Root CA
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:c8:45:8f:a5:5f:c0:65:92:5b:a3:27:bf:25:60:
                    00:dc:09:0b:d2:a3:5c:b0:06:8f:d1:9a:43:76:45:
                    d3:63:15:88:0b:d3:5f:17:db:a6:2a:bd:c7:a3:4e:
                    8b:5e:e8:37:6a:db:da:40:61:4f:d1:e8:c3:2d:08:
                    62:5a:f6:1a:96:d7:e5:2e:7f:72:d3:84:2e:93:38:
                    de:f6:d1:70:26:76:c4:91:d5:70:11:a9:49:50:87:
                    ca:ed:93:17:c7:6e:26:fe:c0:18:ca:0a:2c:a6:af:
                    7c:4a:d3:43:9e:b7:41:fc:ec:8a:37:9f:d5:56:a0:
                    aa:c3:63:bf:db:ea:1c:53:11:74:59:9a:27:d2:05:
                    d8:88:dc:e0:25:43:16:dc:ea:44:a4:59:2d:7b:f4:
                    cf:04:34:12:5f:b2:65:cc:84:b1:3d:06:22:fa:f5:
                    cd:c3:6e:d4:3f:52:6e:6b:8c:7f:42:b5:45:b3:d8:
                    b4:8a:9e:7f:64:ec:bd:c4:7f:54:91:f6:ee:8f:5b:
                    a3:f3:fb:d9:42:19:ef:ec:ba:a9:5b:82:43:d2:f3:
                    1a:62:ef:eb:0a:26:cd:ff:d8:8a:59:fe:a7:c1:b1:
                    94:72:31:8d:bb:26:e5:c6:dc:4e:ec:d8:b4:85:43:
                    df:97:d9:1c:62:35:8f:6c:ac:be:a4:65:67:53:67:
                    c1:2f
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Subject Key Identifier: 
                2E:B7:32:C6:B3:48:97:D1:DE:FB:A3:D6:AE:D6:28:15:8F:4C:F4:5D
            X509v3 Authority Key Identifier: 
                keyid:2E:B7:32:C6:B3:48:97:D1:DE:FB:A3:D6:AE:D6:28:15:8F:4C:F4:5D

            X509v3 Basic Constraints: critical
                CA:TRUE
            X509v3 Key Usage: 
                Certificate Sign, CRL Sign
            X509v3 Subject Alternative Name: 
                email:eosremote@dave.thwaites.org.uk
            X509v3 Issuer Alternative Name: 
                email:eosremote@dave.thwaites.org.uk
    Signature Algorithm: sha256WithRSAEncryption
         9d:4d:60:8f:54:94:cf:87:39:fe:0d:f0:d5:3f:ef:82:2b:b7:
         af:7f:37:02:b4:aa:93:9f:34:0d:5e:7a:0b:f4:3e:87:39:0d:
         a0:ac:a7:94:c3:cd:fe:d9:57:2e:3f:4d:0f:0e:ab:98:08:95:
         6f:7b:ad:67:e9:74:19:90:2d:0b:7b:c5:b1:49:ce:30:18:48:
         76:ca:04:42:47:e8:c9:d4:79:82:16:9f:22:2f:0c:26:1c:ae:
         f7:34:0a:8e:cd:29:32:33:95:3f:c8:39:49:33:a5:cd:17:7e:
         2e:51:ce:e9:02:b9:a1:08:bb:fb:61:c2:fc:83:ed:1a:21:17:
         49:e4:a8:84:8f:79:d8:51:18:28:0b:b7:b6:a2:43:c1:2c:44:
         ac:28:20:72:29:7e:d3:9d:bf:99:d6:4d:13:20:18:f8:d7:f1:
         88:0f:b6:67:85:dc:c4:25:84:c7:e7:f7:10:7c:96:99:a3:b2:
         89:47:a4:a9:62:e1:3e:2f:80:40:2d:36:e4:65:e8:68:69:a9:
         34:db:7b:7e:1e:a9:92:6e:9c:c4:81:09:25:d3:98:07:48:fc:
         53:16:e4:3b:fc:2d:9e:2f:66:dc:cf:56:2d:38:f5:09:54:0d:
         3a:7f:ab:74:fd:8f:3d:4f:fd:21:28:d9:92:8a:92:bf:2f:ac:
         e2:2d:03:72

pi@eosremote:~/EosRemote/ssl $ cat openssl-ca.cnf
#
# OpenSSL example configuration file.
# This is mostly being used for generation of certificate requests.
# Modified and tweaked by DRT for EosRemote, to use as the
#  configuration file for our CA
#

# This definition stops the following lines choking if HOME isn't
# defined.
HOME			= .
RANDFILE		= $ENV::HOME/.rnd
CA_dir			= $ENV::HOME/EosRemote/ssl/CA

# To use this configuration file with the "-extfile" option of the
# "openssl x509" utility, name here the section containing the
# X.509v3 extensions to use:
# extensions		= 
# (Alternatively, use a configuration file that has only
# X.509v3 extensions in its main [= default] section.)


####################################################################

[ ca ]
default_ca	= CA_default		# The default ca section

####################################################################
[ CA_default ]

# dir		= ./CA			# Where everything is kept
certs		= $CA_dir/certs		# Where the issued certs are kept
crl_dir		= $CA_dir/crl		# Where the issued crl are kept
database	= $CA_dir/index.txt	# database index file.
unique_subject	= no			# Set to 'no' to allow creation of
					# several certs with same subject.
new_certs_dir	= $CA_dir/newcerts	# default place for new certs.

certificate	= $CA_dir/cacert.pem 	# The CA certificate
serial		= $CA_dir/serial 	# The current serial number
crlnumber	= $CA_dir/crlnumber	# the current crl number
					# must be commented out to leave a V1 CRL
crl		= $CA_dir/crl.pem 	# The current CRL
private_key	= $CA_dir/private/cakey.pem# The private key
RANDFILE	= $CA_dir/private/.rand	# private random number file

x509_extensions	= usr_cert		# The extensions to add to the cert

# Comment out the following two lines for the "traditional"
# (and highly broken) format.
name_opt 	= ca_default		# Subject Name options
cert_opt 	= ca_default		# Certificate field options

# Extension copying option: use with caution.
copy_extensions = copy

# Extensions to add to a CRL. Note: Netscape communicator chokes on V2 CRLs
# so this is commented out by default to leave a V1 CRL.
# crlnumber must also be commented out to leave a V1 CRL.
# crl_extensions	= crl_ext

default_days	= 365			# how long to certify for
default_crl_days= 30			# how long before next CRL
default_md	= default		# use public key default MD
preserve	= no			# keep passed DN ordering

# A few difference way of specifying how similar the request should look
# For type CA, the listed attributes must be the same, and the optional
# and supplied fields are just that :-)
policy		= policy_match

# For the CA policy
[ policy_match ]
countryName		= match
stateOrProvinceName	= match
organizationName	= match
organizationalUnitName	= optional
commonName		= supplied
emailAddress		= optional

# For the 'anything' policy
# At this point in time, you must list all acceptable 'object'
# types.
[ policy_anything ]
countryName		= optional
stateOrProvinceName	= optional
localityName		= optional
organizationName	= optional
organizationalUnitName	= optional
commonName		= supplied
emailAddress		= optional

####################################################################

[ usr_cert ]

# These extensions are added when 'ca' signs a request.

# This goes against PKIX guidelines but some CAs do it and some software
# requires this to avoid interpreting an end user certificate as a CA.

basicConstraints=CA:FALSE

# Here are some examples of the usage of nsCertType. If it is omitted
# the certificate can be used for anything *except* object signing.

# This is OK for an SSL server.
# nsCertType			= server

# For an object signing certificate this would be used.
# nsCertType = objsign

# For normal client use this is typical
# nsCertType = client, email

# and for everything including object signing:
# nsCertType = client, email, objsign

# This is typical in keyUsage for a client certificate.
# keyUsage = nonRepudiation, digitalSignature, keyEncipherment

# This will be displayed in Netscape's comment listbox.
nsComment			= "OpenSSL Generated Certificate"

# PKIX recommendations harmless if included in all certificates.
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer

# This stuff is for subjectAltName and issuerAltname.
# Import the email address.
# subjectAltName=email:copy
# An alternative to produce certificates that aren't
# deprecated according to PKIX.
# subjectAltName=email:move

# Copy subject details
# issuerAltName=issuer:copy

#nsCaRevocationUrl		= http://www.domain.dom/ca-crl.pem
#nsBaseUrl
#nsRevocationUrl
#nsRenewalUrl
#nsCaPolicyUrl
#nsSslServerName

# This is required for TSA certificates.
# extendedKeyUsage = critical,timeStamping


####################################################################

# Settings for when we generate our self-signed CA certificate

[req]
# dir			= ./CA
default_bits		= 2048
default_keyfile 	= $CA_dir/private/cakey.pem
RANDFILE		= $CA_dir/private/.rand
default_md		= sha256
string_mask		= utf8only
# req_extensions	= req_ext
x509_extensions		= v3_ca	# The extensions to add to the self signed cert
prompt			= no
#attributes		= req_attributes
distinguished_name	= dn

[ dn ]
C=UK
ST=Suffolk
L=Bury St Edmunds
O=EosRemote
OU=https://github.com/DaveThw/EosRemote/
emailAddress=eosremote@dave.thwaites.org.uk
CN = EosRemote Root CA

[ v3_ca ]
# Extensions for a typical CA

# PKIX recommendation.

subjectKeyIdentifier=hash

authorityKeyIdentifier=keyid:always,issuer

basicConstraints = critical,CA:true

# Key usage: this is typical for a CA certificate. However since it will
# prevent it being used as an test self-signed certificate it is best
# left out by default.
keyUsage = cRLSign, keyCertSign
# Key usage for certificate used for HTTPS (?)
#keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment

# Some might want this also
# nsCertType = sslCA, emailCA

# Include email address in subject alt name: another PKIX recommendation
subjectAltName=email:copy
# Copy issuer details
issuerAltName=issuer:copy
```
... to be continued!
