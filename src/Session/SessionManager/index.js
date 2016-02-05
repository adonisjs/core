'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const nodeCookie = require('node-cookie')
const Type = require('type-of-is')
const _ = require('lodash')
const uuid = require('node-uuid')
const util = require('../../../lib/util')

class SessionManager {

  constructor (request, response) {
    this.request = request
    this.response = response
    /**
     * session cookie payload is the original of session cookie when request
     * has been started and incrementally, we will update this value until
     * request is over.
     * @type {Mixed}
     */
    this.sessionCookiePayload = null
  }

  /**
   * @description returns cookie value for session key
   * @method _getSessionCookie
   * @return {Mixed}
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
   * @description writes session key/value pair on cookie
   * @method _setSessionCookie
   * @param  {Mixed}    session
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
   * @description converts value to a valid safe string
   * to be stored inside cookies
   * @method _makeBody
   * @param  {String}  key
   * @param  {Mixed}  value
   * @return {Object}
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
   * @description it returns formatted value from body
   * created via _makeBody
   * @method _reverseBody
   * @param  {Object}     value
   * @return {Mixed}
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
   * @description add values to existing session via cookies
   * @method _setViaCookie
   * @param  {Mixed}      key
   * @param  {Mixed}      value
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
   * @description makes session body by setting/updating values on existing
   * session.
   * @method _makeSessionBody
   * @param  {Object}         existingSession
   * @param  {Mixed}         key
   * @param  {Mixed}         value
   * @return {Object}
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
   * @description get value from session from a given key
   * @method _getViaCookie
   * @return {Object}
   * @private
   */
  _getViaCookie () {
    const existingSession = this._getSessionCookie() || {}
    return _.fromPairs(_.map(existingSession, (value, index) => {
      return [index, this._reverseBody(value)]
    }))
  }

  /**
   * @description sets session value using session driver
   * @method _setViaDriver
   * @param  {Mixed}      key
   * @param  {Mixed}      value
   * @private
   */
  * _setViaDriver (key, value) {
    let sessionId = this._getSessionCookie()

    /**
     * here we create a new session id if session if does not exists
     * in cookies. Also we need to handle migration from cookie
     * driver to other drivers, as with cookie driver the value
     * of sessionId will be the actual session valuesm which is
     * going to be an object. So we need to re-create the
     * sessionId when sessionId is not a string.
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
   * @description get session value from active driver
   * store
   * @method _getViaDriver
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
   * @description returns all session values
   * @method all
   * @return {Object}
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
   * @description save key/value inside session store
   * @method put
   * @param  {Mixed} key
   * @param  {Mixed} value
   * @return {void}
   * @public
   */
  * put (key, value) {
    if (key && typeof (value) === 'undefined' && typeof (key) !== 'object') {
      throw new Error('put expects key/value pair or an object of keys and values')
    }
    const activeDriver = this.constructor.driver

    if (activeDriver === 'cookie') {
      this._setViaCookie(key, value)
    } else {
      yield this._setViaDriver(key, value)
    }
  }

  /**
   * @description removes key/value pair from existing session
   * @method forget
   * @param  {String} key
   * @return {void}
   * @public
   */
  * forget (key) {
    yield this.put(key, null)
  }

  /**
   * @description get value for a given key from session
   * @method get
   * @param  {String} key
   * @param  {Mixed} defaultValue
   * @return {Mixed}
   * @public
   */
  * get (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const sessionValues = yield this.all()
    return util.existy(sessionValues[key]) ? sessionValues[key] : defaultValue
  }

  /**
   * @description combination of get and forget under
   * single method
   * @method pull
   * @param  {String} key
   * @param  {Mixed} defaultValue
   * @return {Mixed}
   * @public
   */
  * pull (key, defaultValue) {
    const value = yield this.get(key, defaultValue)
    yield this.forget(key)
    return value
  }

}

module.exports = SessionManager
