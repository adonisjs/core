'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeCookie = require('node-cookie')
const Type       = require('type-of-is')
const _          = require('lodash')
const uuid       = require('node-uuid')

class SessionManager {

  constructor (request, response) {
    this.request = request
    this.response = response
  }

  /**
   * @description getter for session key name
   * to be stored inside cookies
   * @method sessionKey
   * @return {String}
   * @public
   */
  get sessionKey(){
    return 'adonis-session'
  }

  /**
   * @description returns cookie value for session key
   * @method _getSessionCookie
   * @return {Mixed}
   * @private
   */
  _getSessionCookie () {
    const secret  = process.env.APP_KEY
    const decrypt = !!secret
    return nodeCookie.parse(this.request, secret, decrypt)['adonis-session']
  }

  /**
   * @description writes session key/value pair on cookie
   * @method _setSessionCookie
   * @param  {Mixed}    session
   * @private
   */
  _setSessionCookie (session) {
    const secret  = process.env.APP_KEY
    const encrypt = !!secret
    nodeCookie.create (this.request, this.response, this.sessionKey, session, secret, encrypt)
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
      case "Number":
        value = String(value)
        break
      case "Object":
        value = JSON.stringify(value)
        break
      case "Array":
        value = JSON.stringify(value)
        break
      case "Boolean":
        value = String(value)
        break
      case "Function":
        value = null
        break
      case "RegExp":
        value = null
        break
      case "Date":
        value = String(value)
        break
      case "Error":
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
    switch(value.t){
      case "Number":
        value.d = Number(value.d)
        break
      case "Object":
        value.d = JSON.parse(value.d)
        break
      case "Array":
        value.d = JSON.parse(value.d)
        break
      case "Boolean":
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
    this._setSessionCookie(existingSession)
  }

  /**
   * @description makes session body by setting/updating values on existing
   * session.
   * @method _makeSessionBody
   * @param  {Object}         existingSession [description]
   * @param  {Mixed}         key             [description]
   * @param  {Mixed}         value           [description]
   * @return {Object}                         [description]
   * @private
   */
  _makeSessionBody (existingSession, key, value) {
    /**
     * if arguments contain an object over key/value pair then loop
     * through it and make body for each item inside object
     */
    if(key && typeof(value) === 'undefined' && typeof(key) === 'object'){
      _.each(key, (item, index) => {
        const body = this._makeBody(index, item)
        if(body){
          existingSession[index] = body
        }
      })
      return existingSession
    }

    const body = this._makeBody (key, value)
    if (body) {
      existingSession[key] = body
    }
    /**
     * if someone has passed null as a value then remove key from
     * existing session.
     */
    else if (!body && existingSession[key]) {
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
    return _.object(_.map (existingSession, (value, index) => {
      return [index,this._reverseBody(value)]
    }))
  }


  /**
   * @description sets session value using session driver
   * @method _setViaDriver
   * @param  {Mixed}      key   [description]
   * @param  {Mixed}      value [description]
   * @private
   */
  * _setViaDriver (key, value) {

    let sessionId = this._getSessionCookie()
    let sessionExists = true

    if(!sessionId){
      sessionExists = false
      sessionId = uuid.v1()
    }

    const existingSession = yield this.constructor.driver.read(sessionId)
    const newSession = this._makeSessionBody(existingSession, key, value)
    this._setSessionCookie(sessionId)
    yield this.constructor.driver.write(sessionId,JSON.stringify(newSession))
  }

  /**
   * @description get session value from active driver
   * store
   * @method _getViaDriver
   * @return {Object}                   [description]
   */
  * _getViaDriver () {
    const sessionId = this._getSessionCookie()
    if(!sessionId){
      return {}
    }
    const existingSession = yield this.constructor.driver.read(sessionId)
    return _.object(_.map (existingSession, (value, index) => {
      return [index,this._reverseBody(value)]
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
    if(activeDriver === 'cookie'){
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
   * @throws {Invalid arguments} If key/value does not exists or argument
   *                             is not an object
   * @public
   */
  * put (key, value) {
    if(key && typeof(value) === 'undefined' && typeof(key) !== 'object'){
      throw new Error('put expects key/value pair or an object of keys and values')
    }
    const activeDriver = this.constructor.driver

    if(activeDriver === 'cookie'){
      this._setViaCookie(key, value)
    }
    else{
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
    defaultValue = defaultValue || null
    const sessionValues = yield this.all()
    return sessionValues[key] || defaultValue
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
