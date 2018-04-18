#!/bin/bash
#
# Usage: ./CA.sh ....

usage() {
  echo "Usage: $0 server|CA|help [option]"
}

help() {
  usage
  echo
  echo "Help text"
}

server_usage() {
  echo "Usage: $0 server newkey|update|show|enddate|help"
}

server_help() {
  server_usage
  echo
  echo "server newkey   Creates a new RSA key for the server"
  echo "server update   Creates a new certificate for the server, from the key"
  echo "server show     Show the details of the server certificate"
  echo "server enddate  Show the expiry date/time of the server certificate"
}

server_newkey() {
  openssl genrsa -out server-key.pem 2048
}

server_update() {
  echo "Create a new Certificate Request with existing Key..."
  openssl req -new -key server-key.pem -out server-csr.pem -config server-openssl.cnf
  echo "Use our CA to sign the Certificate Request..."
  # -batch  prevents openssl asking if we want to sign the certificate, and commit
  # -notext prevents the plain text details being included in the pem file
  # -create_serial creates the serial number file if it doesn't exist
  openssl ca -in server-csr.pem -out server-cert.pem -batch -create_serial -config ca-openssl.cnf
  echo "...done!"
}

server_show() {
  openssl x509 -in server-cert.pem -noout -text
}

server_enddate() {
  local when=$(openssl x509 -in server-cert.pem -noout -enddate)
  echo "Expiry date/time: ${when:9}"
}

server() {
  # echo "Server"
  case $1 in
    update)
      server_update
      ;;
    newKey|newkey|new_key)
      server_newkey
      ;;
    show)
      server_show
      ;;
    enddate)
      server_enddate
      ;;
    help)
      server_help
      ;;
    *)
      server_usage
      exit 1
      ;;
  esac
}

ca() {
  echo "CA"
}

case $1 in
  server)
    server $2
    ;;
  CA|ca|Ca|cA)
    ca $2
    ;;
  help)
    help
    ;;
  *)
    usage
    exit 1
    ;;
esac