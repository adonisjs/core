'use strict'

const NE = require('node-exceptions')

class RuntimeException extends NE.RuntimeException {

  /**
   * default error code to be used for raising
   * exceptions
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * this exception is thrown when a route action is referenced
   * inside a view but not registered within the routes file.
   *
   * @param  {String} action
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingRouteAction (action, code) {
    return new this(`The action ${action} has not been found`, code || this.defaultErrorCode, 'E_MISSING_ROUTE_ACTION')
  }

  /**
   * this exception is thrown when a route is referenced inside
   * a view but not registered within the routes file.
   *
   * @param  {String} route
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingRoute (route, code) {
    return new this(`The route ${route} has not been found`, code || this.defaultErrorCode, 'E_MISSING_ROUTE')
  }

  /**
   * this exceptions is raised when mac is invalid when
   * trying to encrypt data
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidEncryptionMac (code) {
    return new this('The MAC is invalid', code || this.defaultErrorCode, 'E_INVALID_ENCRYPTION_MAC')
  }

  /**
   * this exception is raised when encryption payload is not valid
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidEncryptionPayload (code) {
    return new this('The payload is invalid', code || this.defaultErrorCode, 'E_INVALID_ENCRYPTION_PAYLOAD')
  }

  /**
   * this exception is raised when expected value is
   * not a valid json object.
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static malformedJSON (code) {
    return new this('The payload is not a json object', code || this.defaultErrorCode, 'E_MALFORMED_JSON')
  }

  /**
   * this exception is raised when encryption class is not
   * able to decrypt a given piece of data
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static decryptFailed (code) {
    return new this('Could not decrypt the data', code || this.defaultErrorCode, 'E_ENCRYPTION_DECRYPT_FAILED')
  }

  /**
   * this exception is raised when the encryption cipher is
   * not supported or app key length is not in-sync with
   * given cipher
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidEncryptionCipher (code) {
    return new this('The only supported ciphers are AES-128-CBC and AES-256-CBC with the correct key lengths', code || this.defaultErrorCode, 'E_INVALID_ENCRPYTION_CIPHER')
  }

  /**
   * this exception is raised when app key is missing
   * inside config/app.js file.
   *
   * @param  {String} message
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingAppKey (message, code) {
    return new this(message, code || this.defaultErrorCode, 'E_MISSING_APPKEY')
  }

  /**
   * this exception is raised when an uknown
   * session driver is used
   *
   * @param  {String} driver
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidSessionDriver (driver, code) {
    return new this(`Unable to locate ${driver} session driver`, code || this.defaultErrorCode, 'E_INVALID_SESSION_DRIVER')
  }

  /**
   * this exception is raised when a named middleware is used
   * but not registered
   *
   * @param  {String} name
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingNamedMiddleware (name, code) {
    return new this(`${name} is not registered as a named middleware`, code || this.defaultErrorCode, 'E_MISSING_NAMED_MIDDLEWARE')
  }

}

class InvalidArgumentException extends NE.InvalidArgumentException {

  /**
   * default error code to be used for raising
   * exceptions
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * this exception is raised when a method parameter is
   * missing but expected to exist.
   *
   * @param  {String} message
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingParameter (message, code) {
    return new this(message, code || this.defaultErrorCode, 'E_MISSING_PARAMETER')
  }

  /**
   * this exception is raised when a method parameter value
   * is invalid.
   *
   * @param  {String} message
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidParameter (message, code) {
    return new this(message, code || this.defaultErrorCode, 'E_INVALID_PARAMETER')
  }

  /**
   * this exception is raised when unable to find
   * an event with a given name
   *
   * @param  {String} event
   * @param  {String} name
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static missingEvent (event, name, code) {
    return new this(`Cannot find an event with ${name} name for ${event} event`, code || this.defaultErrorCode, 'E_MISSING_NAMED_EVENT')
  }

}

module.exports = {RuntimeException, InvalidArgumentException, HttpException: NE.HttpException}
