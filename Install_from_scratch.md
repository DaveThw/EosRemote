# Notes on how to install / set up a Raspberry Pi, from scratch!

- [March 2018](#march-2018)
- [June 2018](#june-2018)
- [April 2021](#april-2021)


-----------------------------------------------------------------------


## March 2018
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
- Issue a Certificate Signing Request, and then pass it through our new CA
``` shell
pi@eosremote:~/EosRemote/ssl $ openssl req -new -key server.key -out server.csr -config openssl-csr.cnf

pi@eosremote:~/EosRemote/ssl $ touch CA/index.txt
pi@eosremote:~/EosRemote/ssl $ touch CA/index.txt.attr

pi@eosremote:~/EosRemote/ssl $ openssl ca -in server.csr -out server.crt -create_serial -config openssl-ca.cnf 
Using configuration from openssl-ca.cnf
Check that the request matches the signature
Signature ok
Certificate Details:
        Serial Number:
            ae:40:e7:c7:d8:7f:ab:c8
        Validity
            Not Before: Apr 14 18:54:52 2018 GMT
            Not After : Apr 14 18:54:52 2019 GMT
        Subject:
            countryName               = UK
            organizationName          = EosRemote
            organizationalUnitName    = EosRemote LAN Server
            commonName                = eosremote
            emailAddress              = eosremote@dave.thwaites.org.uk
        X509v3 extensions:
            X509v3 Basic Constraints: 
                CA:FALSE
            Netscape Comment: 
                OpenSSL Generated Certificate
            X509v3 Subject Key Identifier: 
                28:15:73:4F:AF:5B:74:5F:03:68:50:E1:42:DF:44:0B:B6:1D:2E:40
            X509v3 Authority Key Identifier: 
                keyid:04:74:7E:38:16:B8:B9:4E:5D:EF:68:F7:72:A6:E6:38:1D:5B:54:74

            X509v3 Key Usage: 
                Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
            X509v3 Subject Alternative Name: 
                DNS:eosremote, DNS:eosremote.local, IP Address:10.101.1.2, IP Address:192.168.1.2, IP Address:192.168.1.80, IP Address:10.0.0.68
Certificate is to be certified until Apr 14 18:54:52 2019 GMT (365 days)
Sign the certificate? [y/n]:y


1 out of 1 certificate requests certified, commit? [y/n]y
Write out database with 1 new entries
Data Base Updated


pi@eosremote:~/EosRemote/ssl $ openssl x509 -in server.crt -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            ae:40:e7:c7:d8:7f:ab:c8
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = UK, ST = Suffolk, L = Bury St Edmunds, O = EosRemote, OU = https://github.com/DaveThw/EosRemote/, emailAddress = eosremote@dave.thwaites.org.uk, CN = EosRemote Root CA
        Validity
            Not Before: Apr 14 18:54:52 2018 GMT
            Not After : Apr 14 18:54:52 2019 GMT
        Subject: C = UK, O = EosRemote, OU = EosRemote LAN Server, CN = eosremote, emailAddress = eosremote@dave.thwaites.org.uk
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                Public-Key: (2048 bit)
                Modulus:
                    00:df:f4:81:87:81:b0:1b:22:0b:b0:fa:fb:d9:9f:
                    fc:2e:36:35:f1:4d:ae:ea:44:f2:ad:c1:37:a7:ea:
                    d2:f9:a3:73:02:f1:75:0d:75:f4:ce:b3:f7:af:78:
                    97:04:7b:79:99:8a:a5:fa:1d:0c:dc:ac:36:53:f7:
                    ed:4a:46:6e:7b:d6:4f:a2:46:b2:49:8a:ce:df:f8:
                    02:f2:3a:7c:e3:8f:14:71:76:ee:1a:71:dc:7c:52:
                    a3:7a:44:30:92:af:b8:8c:7d:a4:19:06:fa:36:29:
                    dc:59:82:6a:2b:e1:6d:e9:d8:2e:14:5b:76:30:b4:
                    f9:df:e6:2d:38:87:c1:8e:c7:11:04:05:28:aa:4a:
                    60:f8:82:8a:76:6d:e7:e4:6d:04:92:9e:28:8a:09:
                    50:07:fa:53:f4:4c:64:f8:58:26:c9:66:b5:33:bc:
                    d1:5a:d5:6e:39:53:5f:60:00:17:60:0c:4c:68:6e:
                    8b:b3:04:88:fc:4f:4c:31:14:50:1d:60:68:a6:ef:
                    5a:4f:0e:88:07:45:86:c8:63:44:53:f8:36:d2:ee:
                    f7:24:a1:14:da:8e:0f:0e:f6:f7:53:4a:af:80:3f:
                    db:40:f7:41:48:af:41:86:1f:f4:d3:d4:ec:a5:a3:
                    a5:2a:94:e4:2c:6d:40:3c:fc:48:8d:40:81:95:5e:
                    5a:0f
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Basic Constraints: 
                CA:FALSE
            Netscape Comment: 
                OpenSSL Generated Certificate
            X509v3 Subject Key Identifier: 
                28:15:73:4F:AF:5B:74:5F:03:68:50:E1:42:DF:44:0B:B6:1D:2E:40
            X509v3 Authority Key Identifier: 
                keyid:04:74:7E:38:16:B8:B9:4E:5D:EF:68:F7:72:A6:E6:38:1D:5B:54:74

            X509v3 Key Usage: 
                Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
            X509v3 Subject Alternative Name: 
                DNS:eosremote, DNS:eosremote.local, IP Address:10.101.1.2, IP Address:192.168.1.2, IP Address:192.168.1.80, IP Address:10.0.0.68
    Signature Algorithm: sha256WithRSAEncryption
         95:9e:60:9a:3e:88:77:b4:da:90:a3:8e:d2:e3:aa:5a:c8:49:
         57:1e:1b:0e:8c:57:c4:df:ab:a3:da:8c:60:31:41:ef:fc:da:
         e2:38:c3:05:97:4c:97:ba:e8:fe:9b:86:4b:be:32:8c:a4:af:
         13:4b:dc:b4:73:31:0c:95:60:3f:4c:f7:dc:9b:6f:76:88:d7:
         c2:c5:13:21:fb:8d:77:e4:e1:cb:9e:c9:db:50:bb:76:7c:dd:
         51:eb:9d:4d:9d:88:34:45:74:3e:ab:b0:e1:86:35:2a:51:af:
         08:cb:9b:12:72:78:71:de:ed:3a:35:a1:e5:38:c8:be:b3:68:
         bb:24:b4:1e:74:06:5d:95:0e:ca:93:65:ce:b0:c8:93:83:b6:
         f5:37:b0:a4:0c:04:ca:a2:df:7e:4d:d5:f5:38:6f:f7:26:eb:
         ff:b7:be:20:04:c0:a3:b1:8a:85:8d:b6:e9:bf:f2:ed:7b:d7:
         e1:55:14:a7:c4:56:1b:29:73:fd:29:ff:35:7e:8f:35:d2:5c:
         02:e4:9b:a4:10:cb:90:08:a5:cb:ea:10:28:f4:ed:24:ce:a8:
         c0:70:fb:3f:c3:35:40:4e:51:4e:03:ab:4e:f9:e4:d0:00:fb:
         d4:4f:d8:80:1d:9d:f5:ad:82:f9:dc:c8:a5:e1:9b:46:6f:83:
         e6:e4:80:1c
```
... to be continued!


-----------------------------------------------------------------------


## June 2018

(Working on a Raspberry Pi 1, using June 2018 [Raspbian Image](https://www.raspberrypi.org/downloads/raspbian/) (release date: 2018-06-27), doing the set-up on 2018-07-29)

- Flash latest [Raspbian Image](https://www.raspberrypi.org/downloads/raspbian/) onto an SD card (tested using the June 2018 image) - [see here for notes about doing it on a Chromebook](https://davethw.github.io//theatre-royal/eos-remote/Flashing-RaspberryPi-Image.html)
- Boot up the Raspberry Pi - you'll need a monitor and mouse connected, maybe also a keyboard
- On first boot, you get a 'Welcome to Raspbery Pi' intro:
  - Set Country/location details first (Country: United Kingdom / Language: British English / Timezone: London)
  - Change default password (needs a keyboard!..) (just click 'next' to skip for now)
  - Check for updates (click 'Next') - takes a little while (~15-30(?) minutes on a RPi1, a month after the release...)
  - Initial setup is complete - press 'Reboot' to reboot!
  - You may get a 'Raspbian has been updated' message, telling you some configuration files have been overwritten...  (backups in ~/oldconffiles)
- From the Applications menu, choose Preferences -> Raspberry Pi Configuration
  - Under System, choose a fixed resolution (if you want to connect with VNC, without a monitor connected) - maybe CEA mode 4 1280x720..?
  - It's also useful to Disable Underscan for VNC, as Underscan just reduces the resolution of the display (1280x720 becomes 1184x624!)
  - Under Interfaces, turn on (SSH and) VNC
  - Reboot
- You should now be able to connect using VNC to the Pi's IP address, display 0 - eg 192.168.1.80:0 - and you should therefore be able to disconnect the monitor and mouse (and keyboard) if you wish, and complete the rest of the setup remotely.
- SSH will warn you that you haven't changed the default password for the 'pi' user - this is a security risk!
  - Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Change Password
- Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Hostname
  - eosremote
  - Reboot
- Maybe look at Applications menu -> Preferences -> Raspberry Pi Configuration -> Localisation
  - WiFi Country: GB Britain (UK)
- Install Node-RED:
  - Applications menu -> Preference -> Recommended Software -> Programming
  - Tick the box next to Node-RED, then click OK to install
  - (should now be able to upgrade Node-RED with `sudo apt upgrade`  See https://nodered.org/docs/hardware/raspberrypi)
- VNC Server -> Sign In to account
  - useful for connecting from VNC Connect client!
- Check if node.js and/or npm is installed:
  - `~ $ node -v` -> `v.8.11.1`
  - `~ $ npm -v` -> `bash: npm: command not found`
  - It would seem that node.js got installed somewhere along the line (maybe when we installed Node-RED..?), but npm did not...
    - If so, install npm with `sudo apt install npm` (I think that's the 'best' way..?)
    - installs a whole bunch of extra dependancies - took about 4-5mins
    - `~ $ npm -v` -> `1.4.21`
- Install EosRemote
  - follow my instructions!..
```shell
~ $ cd
~ $ git clone https://github.com/DaveThw/EosRemote.git
~ $ cd ~/EosRemote/
~/EosRemote $ ln -sb $(pwd)/node-red/package.json ~/.node-red/
~/EosRemote $ ln -sb $(pwd)/node-red/settings.js ~/.node-red/
~/EosRemote $ ln -s $(pwd)/docs/ ~/www
~/EosRemote $ cd ~/.node-red
~/.node-red $ npm install
```
  - (`npm install` took approx. 14mins - serialport had to fallback-to-build, which threw up a bunch of warnings, but seemed to succeed! - npm also gave a couple of warnings that the project file doesn't have a licence or repository field, or README data...)


-----------------------------------------------------------------------


## April 2021

(Working on a Raspberry Pi 1, using March 2021 [Raspberry Pi OS (with Desktop)](https://www.raspberrypi.org/software/operating-systems/#raspberry-pi-os-32-bit) (release date: 2021-03-04), doing the set-up on 2021-04-04)

- Flash latest [Raspberry Pi OS (with Desktop)](https://www.raspberrypi.org/software/operating-systems/#raspberry-pi-os-32-bit) onto an SD card (tested using the March 2021 image) using the [Raspberry Pi Imager](https://www.raspberrypi.org/software/) - note: the latest version has some dependancies that aren't available on my Chromebook/Gallium OS, so I downloaded a previous version (1.5) from [their downloads server](https://downloads.raspberrypi.org/imager/).
- Boot up the Raspberry Pi - you'll need a monitor and mouse connected (and a keyboard to set up a password)
- On first boot, after s hort while you'll get to the desktop, and the 'Welcome to Raspbery Pi' initial set-up wizard thingy:
  - Set Country/location details first (Country: United Kingdom / Language: British English / Timezone: London - no need to tick 'Use English language' or 'Use US keyboard')
  - Change default password (needs a keyboard!..) (just click 'next' to skip for now)
  - Tick the box to say 'This screen shows a black border around the desktop' - this will disable Underscan, after the next reboot (it's useful to Disable Underscan for VNC, as Underscan just reduces the resolution of the display - 1280x720 becomes 1184x624! But... see below :wink:)
  - Check for updates (click 'Next') - takes a little while (~55 minutes on a RPi1, a month after the release...)
  - Initial setup is complete - press 'Reboot' to reboot!  (Or 'Later' to do it, well... later!)
  - You may get a 'Raspbian has been updated' message, telling you some configuration files have been overwritten...  (backups in ~/oldconffiles)
- From the Applications menu, choose Preferences -> Raspberry Pi Configuration
  - Under Display, choose a fixed resolution (if you want to connect with VNC, without a monitor connected) - maybe CEA mode 4 1280x720..?
  - Maybe also turn off 'Screen Blanking' (not sure if this affects VNC?)
  - Under Interfaces, turn on SSH and VNC
  - Reboot
- You should now be able to connect using VNC to the Pi's IP address, display 0 - eg 192.168.1.80:0 - and you should therefore be able to disconnect the monitor and mouse (and keyboard) if you wish, and complete the rest of the setup remotely.
- SSH will warn you that you haven't changed the default password for the 'pi' user - this is a security risk!
  - Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Change Password
- If you want to be cunning, you can use Underscan to tweak the resolution of the VNC display - for my current laptop, 1280x720 is a little bit too tall:
  - Edit `/boot/config.txt` - needs root access, so in a terminal do something like `sudo leafpad /boot/config.txt`
  - If not already done, comment out the disable_overscan line: `#disable_overscan=1`
  - Overscan seems to default to taking 48 pixels off the top, bottom, left and right of the display.  You can adjust this with the next few lines - a negative number will reduce the overscan, positive will increase it further.
  - For example, to have the full width of your configured resolution, use `overscan_left=-48` and `overscan_right=-48`
  - And for me, to reduce the height by 9 pixels, use something like `overscan_top=-48` and `overscan_bottom=-39`
- Applications menu -> Preferences -> Raspberry Pi Configuration -> System -> Hostname
  - remcont
  - Reboot
- Maybe look at Applications menu -> Preferences -> Raspberry Pi Configuration -> Localisation
  - WiFi Country: GB Britain (UK)
- Install Node-RED:
  - See <https://nodered.org/docs/hardware/raspberrypi>
  - Run `bash <(curl -sL https://raw.githubusercontent.com/node-red/linux-installers/master/deb/update-nodejs-and-nodered)`
  - This might take a while - it took 9 1/2 hrs on my RPi1!!

- VNC Server -> Sign In to account
  - useful for connecting from VNC Connect client!

- Check that node.js and npm are installed:
  - `~ $ node -v` -> `v.12.20.1`
  - `~ $ npm -v` -> `6.14.10`

- To [use SSH for GitHub](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh):
  - First, create a new SSH public/private key pair: `ssh-keygen -t ed25519 -C "ssh@dave.thwaites.org.uk"`
  - Then open `~/.ssh/id_ed25519.pub` (your public key) and copy the contents
  - Then add the contents as a new [public key on GitHub](https://github.com/settings/keys)

- Install EosRemote
  - follow (and update) [my instructions](./Installing.md)!..
```shell
~ $ cd
~ $ git clone git@github.com:DaveThw/EosRemote.git
~ $ cd ~/EosRemote/
~/EosRemote $ ln -sb $(pwd)/node-red/package.json ~/.node-red/
~/EosRemote $ ln -sb $(pwd)/node-red/settings.js ~/.node-red/
~/EosRemote $ ln -s $(pwd)/docs/ ~/www
~/EosRemote $ cd ~/.node-red
~/.node-red $ npm install
```
  - (`npm install` took approx. 14mins - serialport had to fallback-to-build, which threw up a bunch of warnings, but seemed to succeed! - npm also gave a couple of warnings that the project file doesn't have a licence or repository field, or README data...)
