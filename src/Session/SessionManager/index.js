'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const nodeCookie = require('node-cookie')
const Type = require('type-of-is')
const _ = require('lodash')
const NE = require('node-exceptions')
const uuid = require('node-uuid')
const util = require('../../../lib/util')

/**
 * Session facade to expose methods to read
 * and write values inside the session
 * store.
 * @class
 */
class SessionManager {

  constructor (request, response) {
    this.request = request
    this.response = response
    /**
     * session cookie payload is the original value of session cookie when request
     * is started and incrementally we will update this value until
     * request is over.
     * @type {Mixed}
     */
    this.sessionCookiePayload = null
  }

  /**
   * returns cookie value for session key
   *
   * @return {Mixed}
   *
   * @private
   */
  _getSessionCookie () {
    const secret = this.constructor.config.get('app.appKey')
    const decrypt = !!secret
    if (!this.sessionCookiePayload) {
      this.sessionCookiePayload = nodeCookie.parse(this.request, secret, decrypt)[this.constructor.options.cookie]
    }
    return this.sessionCookiePayload
  }

  /**
   * writes session key/value pair on cookie
   *
   * @param  {Mixed}    session
   *
   * @private
   */
  _setSessionCookie (session) {
    const secret = this.constructor.config.get('app.appKey')
    const encrypt = !!secret

    /**
     * options to be sent to cookie
     * @type {Object}
     */
    const options = {
      domain: this.constructor.options.domain,
      path: this.constructor.options.path,
      secure: this.constructor.options.secure
    }

    /**
     * only set expires at when browser clear is set to false
     */
    if (!this.constructor.options.browserClear) {
      options.expires = new Date(Date.now() + (this.constructor.options.age * 60 * 1000))
    }
    /**
     * here we update the cookie payload, this is what will be saved
     * to the browser on request finish. But before that we need
     * to persist it.
     */
    this.sessionCookiePayload = session
    nodeCookie.create(this.request, this.response, this.constructor.options.cookie, session, options, secret, encrypt)
  }

  /**
   * converts value to a valid safe string
   * to be stored inside cookies
   *
   * @param  {String}  key
   * @param  {Mixed}  value
   * @return {Object}
   *
   * @private
   */
  _makeBody (key, value) {
    const type = Type.string(value)

    /**
     * converting value for a safe string based
     * on its type and reject invalid types
     * @invalidTypes          Function
     *                        RegExp
     *                        Error
     */
    switch (type) {
      case 'Number':
        value = String(value)
        break
      case 'Object':
        value = JSON.stringify(value)
        break
      case 'Array':
        value = JSON.stringify(value)
        break
      case 'Boolean':
        value = String(value)
        break
      case 'Function':
        value = null
        break
      case 'RegExp':
        value = null
        break
      case 'Date':
        value = String(value)
        break
      case 'Error':
        value = null
        break
    }

    if (!value) {
      return value
    }

    return {
      d: value,
      t: type
    }
  }

  /**
   * it returns formatted value from body
   * previously created via _makeBody
   *
   * @param  {Object}     value
   * @return {Mixed}
   *
   * @private
   */
  _reverseBody (value) {
    /**
     * if parsed do not re parse
     */
    if (typeof (value.d) === value.t.toLowerCase()) {
      return value.d
    }
    switch (value.t) {
      case 'Number':
        value.d = Number(value.d)
        break
      case 'Object':
        try {
          value.d = JSON.parse(value.d)
        } catch (e) {}
        break
      case 'Array':
        try {
          value.d = JSON.parse(value.d)
        } catch (e) {}
        break
      case 'Boolean':
        value.d = value.d === 'true' || value.d === '1'
        break
    }
    return value.d
  }

  /**
   * add values to existing session via cookies
   *
   * @param  {Mixed}      key
   * @param  {Mixed}      value
   *
   * @private
   */
  _setViaCookie (key, value) {
    /**
     * parsing existing session from request
     */
    const existingSession = this._getSessionCookie() || {}
    const newSession = this._makeSessionBody(existingSession, key, value)
    this._setSessionCookie(newSession)
  }

  /**
   * makes session body by setting/updating values on existing
   * session.
   *
   * @param  {Object}         existingSession
   * @param  {Mixed}         key
   * @param  {Mixed}         value
   * @return {Object}
   *
   * @private
   */
  _makeSessionBody (existingSession, key, value) {
    /**
     * we need to make sure existing session is an object, as it is possible
     * to have other values instead of an object. This situation is likely
     * to occur when encryption is toggled
     */
    existingSession = typeof (existingSession) === 'object' ? existingSession : {}
    /**
     * if arguments contain an object over key/value pair then loop
     * through it and make body for each item inside object
     */
    if (key && typeof (value) === 'undefined' && typeof (key) === 'object') {
      _.each(key, (item, index) => {
        const body = this._makeBody(index, item)
        if (body) {
          existingSession[index] = body
        }
      })
      return existingSession
    }

    const body = this._makeBody(key, value)
    if (body) {
      existingSession[key] = body
    } else if (!body && existingSession[key]) {
      /**
       * if someone has passed null as a value then remove key from
       * existing session.
       */
      delete existingSession[key]
    }
    return existingSession
  }

  /**
   * get value from session from a given key
   *
   * @return {Object}
   *
   * @private
   */
  _getViaCookie () {
    const existingSession = this._getSessionCookie() || {}
    return _.fromPairs(_.map(existingSession, (value, index) => {
      return [index, this._reverseBody(value)]
    }))
  }

  /**
   * sets session value using session driver
   *
   * @param  {Mixed}      key
   * @param  {Mixed}      value
   *
   * @private
   */
  * _setViaDriver (key, value) {
    let sessionId = this._getSessionCookie()

    /**
     * here we create a new session id if does not exists in cookies.
     * Also we need to handle migration from cookie driver to other
     * drivers, as with cookie driver the value of sessionId will
     * be the actual session values which is going to be an
     * object. So we need to re-create the sessionId when
     * sessionId is not a string.
     */
    if (!sessionId || typeof (sessionId) !== 'string') {
      sessionId = uuid.v1()
    }

    const existingSession = yield this.constructor.driver.read(sessionId)
    const newSession = this._makeSessionBody(existingSession, key, value)
    this._setSessionCookie(sessionId)
    yield this.constructor.driver.write(sessionId, JSON.stringify(newSession))
  }

  /**
   * get session value from active driver store
   *
   * @return {Object}
   */
  * _getViaDriver () {
    const sessionId = this._getSessionCookie()
    if (!sessionId) {
      return {}
    }
    const existingSession = yield this.constructor.driver.read(sessionId)
    return _.fromPairs(_.map(existingSession, (value, index) => {
      return [index, this._reverseBody(value)]
    }))
  }

  /**
   * returns all session values
   *
   * @return {Object}
   *
   * @example
   * yield session.all()
   *
   * @public
   */
  * all () {
    const activeDriver = this.constructor.driver
    if (activeDriver === 'cookie') {
      return this._getViaCookie()
    }
    return yield this._getViaDriver()
  }

  /**
   * save key/value pair inside session store
   *
   * @param  {Mixed} key - Session key to which value should be saved. Also
   *                       it can be a self contained object
   * @param  {Mixed} [value] - Value to save next to key. Must not be set when
   *                           key itself is an object
   * @example
   * yield session.put('name', 'doe')
   * yield session.put({name: 'doe'})
   *
   * @public
   */
  * put (key, value) {
    if (key && typeof (value) === 'undefined' && typeof (key) !== 'object') {
      throw new NE.InvalidArgumentException('put expects key/value pair or an object of keys and values')
    }
    const activeDriver = this.constructor.driver

    if (activeDriver === 'cookie') {
      this._setViaCookie(key, value)
    } else {
      yield this._setViaDriver(key, value)
    }
  }

  /**
   * removes key/value pair from existing session
   *
   * @param  {String} key
   *
   * @example
   * yield session.forget('name')
   *
   * @public
   */
  * forget (key) {
    yield this.put(key, null)
  }

  /**
   * get value for a given key from session
   *
   * @param  {String} key - key to get value for
   * @param  {Mixed} defaultValue - default value when actual value is
   *                                undefined for null
   * @return {Mixed}
   *
   * @example
   * yield session.get('name')
   * yield session.get('name', 'defaultName')
   *
   * @public
   */
  * get (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const sessionValues = yield this.all()
    return util.existy(sessionValues[key]) ? sessionValues[key] : defaultValue
  }

  /**
   * combination of get and forget under single method
   *
   * @param  {String} key - key to get value for
   * @param  {Mixed} defaultValue - default value when actual value is
   *                                undefined for null
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

}

module.exports = SessionManager
