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
..................................................................................................................................+++
.....+++
writing new private key to './CA/private/cakey.pem'
-----

pi@eosremote:~/EosRemote/ssl $ openssl x509 -in ./CA/cacert.pem -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            b8:f9:df:34:c2:e9:6b:dd
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = UK, ST = Suffolk, L = Bury St Edmunds, O = EosRemote, OU = https://github.com/DaveThw/EosRemote/, emailAddress = eosremote@dave.thwaites.org.uk, CN = EosRemote Root CA
        Validity
            Not Before: Apr 14 06:46:48 2018 GMT
            Not After : Apr 14 06:46:48 2028 GMT
        Subject: C = UK, ST = Suffolk, L = Bury St Edmunds, O = EosRemote, OU = https://github.com/DaveThw/EosRemote/, emailAddress = eosremote@dave.thwaites.org.uk, CN = EosRemote Root CA
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:ca:35:21:fd:0b:22:c7:bc:92:07:03:2b:28:ef:
                    bc:39:32:73:fa:7f:de:98:c8:b6:23:61:a8:3a:d2:
                    6c:a2:41:6b:64:ce:bf:74:a8:ad:83:5e:8d:7e:96:
                    85:20:97:9c:46:2b:12:a3:fd:83:c4:1a:81:64:6e:
                    37:0a:1b:b2:6b:b3:6a:f5:e4:97:9f:60:9e:d7:57:
                    df:18:db:00:75:6b:09:c3:c9:b1:7e:03:7a:26:fa:
                    9b:a2:aa:90:dd:1a:ac:71:6e:38:fe:e4:31:3c:5e:
                    f4:88:73:cc:5e:31:c0:b4:57:6b:f6:bf:40:0c:65:
                    64:5e:b8:b9:a8:af:b2:a6:2a:4d:cf:e7:ef:f5:a2:
                    22:d0:06:a1:f1:91:69:d6:e4:8a:60:7e:c0:65:79:
                    cf:d9:23:5a:42:ab:a9:59:fa:81:8f:a5:99:3a:1b:
                    2a:2b:88:79:41:17:fa:5e:7f:76:b6:c8:c2:93:c9:
                    2a:70:3f:83:ff:57:d3:61:35:eb:29:8e:98:ca:d5:
                    f9:51:c8:d4:0b:37:f1:37:7f:0d:17:a0:bd:3e:01:
                    24:9c:d2:2e:67:af:7c:fb:cb:b0:06:ec:68:a4:49:
                    51:c5:ad:03:db:6c:ac:ba:b9:2e:84:a0:b5:54:07:
                    b3:93:b5:fa:73:9f:04:7c:6c:04:26:56:20:11:b4:
                    c2:83
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Subject Key Identifier: 
                97:77:AD:95:B6:BE:0C:EC:C8:15:ED:FE:33:FC:AD:AA:74:43:75:0D
            X509v3 Authority Key Identifier: 
                keyid:97:77:AD:95:B6:BE:0C:EC:C8:15:ED:FE:33:FC:AD:AA:74:43:75:0D

            X509v3 Basic Constraints: critical
                CA:TRUE
            X509v3 Key Usage: 
                Certificate Sign, CRL Sign
            X509v3 Subject Alternative Name: 
                email:eosremote@dave.thwaites.org.uk
            X509v3 Issuer Alternative Name: 
                email:eosremote@dave.thwaites.org.uk
    Signature Algorithm: sha256WithRSAEncryption
         c7:4a:80:2c:40:87:15:05:4b:86:0b:12:d9:18:44:20:75:98:
         d6:f0:4f:85:db:50:f5:b0:07:c7:9c:6e:81:a1:55:81:8f:7b:
         6d:1e:97:6f:bf:43:53:c1:41:6f:6f:d0:d5:a8:e0:25:d5:e4:
         ae:a6:48:ec:be:21:ce:8d:53:7b:19:86:09:44:6c:1a:62:76:
         e8:f9:6a:1a:78:d4:d8:c8:32:45:0d:cc:e2:76:d5:61:fb:31:
         1c:c4:09:f9:56:11:18:88:9d:4b:a9:6f:fe:22:8a:30:44:51:
         de:05:85:d8:4f:c5:85:f6:aa:45:2f:9a:ec:90:8e:73:91:66:
         1c:c9:0a:7a:7a:97:97:4a:53:a7:89:49:ea:52:95:d0:b4:76:
         f4:53:56:84:c0:e9:f2:43:bf:bb:1a:72:97:1e:c0:b4:63:d1:
         a6:c0:a7:27:3b:65:f7:36:eb:0b:e3:62:5d:9e:31:70:e3:b9:
         1b:84:c3:bb:b6:24:eb:2a:0e:78:d3:62:24:66:43:ee:ca:ae:
         e2:6b:c2:50:15:53:df:d2:8a:42:b5:b7:d2:29:67:7f:e7:6b:
         7b:18:db:8d:55:8f:7a:8b:e1:85:b0:cf:1c:34:1c:1a:ef:a5:
         0b:26:58:c9:8a:db:44:a1:b8:10:28:4a:76:42:f4:97:9e:6c:
         e1:c9:d1:62

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

dir		= ./CA			# Where everything is kept
certs		= $dir/certs		# Where the issued certs are kept
crl_dir		= $dir/crl		# Where the issued crl are kept
database	= $dir/index.txt	# database index file.
unique_subject	= no			# Set to 'no' to allow creation of
					# several certs with same subject.
new_certs_dir	= $dir/newcerts		# default place for new certs.

certificate	= $dir/cacert.pem 	# The CA certificate
serial		= $dir/serial 		# The current serial number
crlnumber	= $dir/crlnumber	# the current crl number
					# must be commented out to leave a V1 CRL
crl		= $dir/crl.pem 		# The current CRL
private_key	= $dir/private/cakey.pem# The private key
RANDFILE	= $dir/private/.rand	# private random number file

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
dir			= ./CA
default_bits		= 2048
default_keyfile 	= $dir/private/cakey.pem
RANDFILE		= $dir/private/.rand
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
