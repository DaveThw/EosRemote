// eslint-disable-next-line no-undef
const net = typeof __dirname !== 'undefined' ? require('net') : undefined

/**
 * Status flags
 * @private
 */
const STATUS = {
  IS_NOT_INITIALIZED: -1,
  IS_CONNECTING: 0,
  IS_OPEN: 1,
  IS_CLOSING: 2,
  IS_CLOSED: 3,
}

/**
 * Default options
 * @private
 */
const defaultOptions = {
  host: 'localhost',
  port: 8080,
}

/**
 * OSC plugin for a TCP client running in node context
 */
//export default class TCPClientPlugin {
module.exports = class TCPClientPlugin {
  /**
   * Create an OSC TCPClientPlugin instance with given options.
   * Defaults to *localhost:8080* for connecting to a TCP server
   * @param {object} [options] Custom options
   * @param {string} [options.host='localhost'] Hostname of TCP server
   * @param {number} [options.port=8080] Port of TCP server
   * @param {string} [options.localAddress] Local address the socket should connect from
   * @param {number} [options.localPort] Local port the socket should connect from
   *
   * @example
   * const plugin = new OSC.TCPClientPlugin({ port: 9912 })
   * const osc = new OSC({ plugin: plugin })
   */
  constructor(customOptions) {
    if (!net) {
      throw new Error('TCPClientPlugin can\'t be used in a browser context')
    }

    /**
     * @type {object} options
     * @private
     */
    this.options = Object.assign({}, defaultOptions, customOptions)

    /**
     * @type {object} socket
     * @private
     */
    this.socket = null
    /**
     * @type {number} socketStatus
     * @private
     */
    this.socketStatus = STATUS.IS_NOT_INITIALIZED

    /**
     * @type {function} notify
     * @private
     */
    this.notify = () => {}
  }

  /**
   * Internal method to hook into osc library's
   * EventHandler notify method
   * @param {function} fn Notify callback
   * @private
   */
  registerNotify(fn) {
    this.notify = fn
  }

  /**
   * Returns the current status of the connection
   * @return {number} Status identifier
   */
  status() {
    return this.socketStatus
  }

  /**
   * Connect to a TCP server. Defaults to global options
   * @param {object} [customOptions] Custom options
   * @param {string} [customOptions.host] Hostname of TCP server
   * @param {number} [customOptions.port] Port of TCP server
   */
  open(customOptions = {}) {
    const options = Object.assign({}, this.options, customOptions)
    const { port, host } = options

    // close socket when already given
    if (this.socket) {
      this.close()
    }

    // create TCP client
    this.socket = net.createConnection(options)
    // this.socket.binaryType = 'arraybuffer'
    this.socketStatus = STATUS.IS_CONNECTING

    // register events
    this.socket.on('ready', () => {
      this.socketStatus = STATUS.IS_OPEN
      this.notify('open')
    })

    this.socket.on('close', () => {
      this.socketStatus = STATUS.IS_CLOSED
      this.notify('close')
    })

    this.socket.on('error', (error) => {
      this.notify('error', error)
    })

    this.socket.on('data', (message) => {
      console.log("Raw Message:", message)

      var i=0;
      while (i < message.length) {
        var len = (message[i]<<24) + (message[i+1]<<16) + (message[i+2]<<8) + message[i+3];
        i += 4;
        // var buf = Buffer.allocUnsafe(len);
        var buf = new Buffer(len);
        message.copy(buf,0,i,i+len);
        console.log("Raw Part:", buf);
//        this.notify(buf);
        this.notify(message);
        i += len;
      }

     })
  }

  /**
   * Close TCP socket
   */
  close() {
    this.socketStatus = STATUS.IS_CLOSING
    this.socket.end()
  }

  /**
   * Send an OSC Packet, Bundle or Message to TCP server
   * @param {Uint8Array} binary Binary representation of OSC Packet
   */
  send(binary) {
    this.socket.write(binary)
  }
}