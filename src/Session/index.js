'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

/**
 * @typedef {SessionDriver}
 * @type {Class}
 */

const _ = require('lodash')
const uuid = require('node-uuid')

const Store = require('./Store')
const CookieManager = require('./CookieManager')
const CE = require('../Exceptions')
const util = require('../../lib/util')

let sessionManagerDriver = null
let sessionManagerConfig = {}

/**
 * Session class to read/write values to the session
 * store, using one of the available drivers.
 *
 * @class
 */
class Session {

  /**
   * @constructor
   */
  constructor (request, response) {
    this.request = request
    this.response = response
    this._instantiate()
    this._setDriverRequest()
  }

  /**
   * Returns the active driver instance.
   *
   * @return {SessionDriver}
   */
  static get driver () {
    return sessionManagerDriver
  }

  /**
   * Set session driver instance as a static property.
   * This needs to be done before initiating the
   * class so that session instance has a
   * valid driver.
   *
   * @param  {SessionDriver} driver
   */
  static set driver (driver) {
    sessionManagerDriver = driver
  }

  /**
   * Returns config provider in use.
   *
   * @return {Object}
   */
  static get config () {
    return sessionManagerConfig
  }

  /**
   * Sets config driver to use for reading
   * session configuration.
   *
   * @param  {Object} config
   */
  static set config (config) {
    sessionManagerConfig = config
  }

  /**
   * Sets current HTTP request and response on the active
   * driver. Some drivers like Cookie driver needs current
   * request refrence to read/write cookies. It can be
   * left unimplemented for other driver.s
   *
   * @private
   */
  _setDriverRequest () {
    if (this.constructor.driver.setRequest) {
      this.constructor.driver.setRequest(this.request, this.response)
    }
  }

  /**
   * Instantiates the class properly by setting some
   * options on the instance
   *
   * @private
   */
  _instantiate () {
    this.cookieManager = new CookieManager(this.constructor.config)
    this.sessionCookieName = this.constructor.config.get('session.cookie', 'adonis-session')
    this.sessionExpiryMs = this.constructor.config.get('session.age', 120) * 60 * 1000
    this.sessionId = null
    this.sessionPayload = null
  }

  /**
   * Returns session id by reading it from the cookies. It
   * session id is not set, it will create a new uid to
   * be used as a session id.
   *
   * @return {String}
   */
  getSessionId () {
    if (this.sessionId) {
      return this.sessionId
    }
    const sessionId = this.cookieManager.read(this.request, this.sessionCookieName)
    this.sessionId = (!sessionId || typeof (sessionId) !== 'string') ? uuid.v1() : sessionId
    return this.sessionId
  }

  /**
   * Writes session id on the request as a cookie. It will
   * be encrypted if appKey is defined inside the config
   * file.
   *
   * @param {String} sessionId
   */
  setSessionId (sessionId) {
    this.sessionId = sessionId
    this.cookieManager.set(this.request, this.response, this.sessionCookieName, sessionId)
  }

  /**
   * Returns values for a given session id. Values returned
   * from the driver are unpacked to be used to mutations.
   *
   * @param   {String} sessionId
   *
   * @return  {Object}
   *
   * @private
   */
  * _getSessionValues (sessionId) {
    if (this.sessionPayload) {
      return this.sessionPayload
    }
    const sessionValues = yield this.constructor.driver.read(sessionId)
    this.sessionPayload = Store.unPackValues(sessionValues)
    return this.sessionPayload
  }

  /**
   * Writes values to the session driver by packing them
   * into a safe object.
   *
   * @method  _setSessionValues
   *
   * @param {String} sessionId
   * @see Session.put
   *
   * @return {Boolean}
   *
   * @private
   */
  * _setSessionValues (sessionId, key, value) {
    const sessionValues = yield this._getSessionValues(sessionId)
    if (_.isObject(key)) {
      _.assign(sessionValues, key)
    } else {
      _.set(sessionValues, key, value)
    }
    this.sessionPayload = sessionValues
    return yield this.constructor.driver.write(sessionId, Store.packValues(this.sessionPayload))
  }

  /**
   * Returns a deep clone of session values.
   *
   * @return {Object}
   *
   * @example
   * yield session.all()
   */
  * all () {
    const values = yield this._getSessionValues(this.getSessionId())
    return _.cloneDeep(values)
  }

  /**
   * Saves key/value pair inside the session store.
   *
   * @param  {Mixed} key     - Key can be a normal key/value pair key or
   *                           it can be a self contained object
   * @param  {Mixed} [value] - Value to save next to key. Must not be passed
   *                           when key itself is an object
   *
   * @return {Boolean}
   *
   * @example
   * yield session.put('name', 'doe')
   * yield session.put({name: 'doe'})
   *
   * @throws {InvalidArgumentException} If parameters are not defined as intended
   */
  * put (key, value) {
    if (key && typeof (value) === 'undefined' && !_.isObject(key)) {
      throw CE.InvalidArgumentException.invalidParameter('Session.put expects a key/value pair or an object of keys and values')
    }
    const sessionId = this.getSessionId()
    this.setSessionId(sessionId)
    return yield this._setSessionValues(sessionId, key, value)
  }

  /**
   * @see this.put
   * @alias this.put
   */
  set (key, value) {
    return this.put(key, value)
  }

  /**
   * Removes value set next to a key from the session store.
   *
   * @param  {String} key
   *
   * @return {Boolean}
   *
   * @example
   * yield session.forget('name')
   */
  * forget (key) {
    return yield this.put(key, null)
  }

  /**
   * Get value for a given key from the session store.
   *
   * @param  {String} key
   * @param  {Mixed} defaultValue - default value when actual value is
   *                                undefined for null
   * @return {Mixed}
   *
   * @example
   * yield session.get('name')
   * yield session.get('name', 'defaultName')
   */
  * get (key, defaultValue) {
    const sessionValues = yield this._getSessionValues(this.getSessionId())
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const value = _.get(sessionValues, key)
    return util.existy(value) ? value : defaultValue
  }

  /**
   * Combination of get and forget under single method
   *
   * @see  this.get
   *
   * @return {Mixed}
   *
   * @example
   * yield session.pull('name')
   * yield session.pull('name', 'defaultValue')
   *
   * @public
   */
  * pull (key, defaultValue) {
    const value = yield this.get(key, defaultValue)
    yield this.forget(key)
    return value
  }

  /**
   * Flush the user session by dropping the cookie and notifying
   * the driver to destroy values.
   *
   * @method flush
   *
   * @return {Boolean}
   */
  * flush () {
    yield this.constructor.driver.destroy(this.getSessionId())
    this.sessionPayload = null
    this.sessionId = null
    return this.cookieManager.remove(this.request, this.response, this.sessionCookieName)
  }

}

module.exports = Session
