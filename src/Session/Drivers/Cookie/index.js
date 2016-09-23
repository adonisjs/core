'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const CookieManager = require('../../CookieManager')
const _ = require('lodash')

/**
 * Cookie driver for the session manager
 * @class
 * @alias SessionCookieDriver
 */
class Cookie {

  /**
   * Injects ['Adonis/Src/Config']
   */
  static get inject () {
    return ['Adonis/Src/Config']
  }

  /**
   * @constructor
   */
  constructor (Config) {
    this.cookieName = `${Config.get('session.cookie', 'adonis-session')}-value`
    this.cookieManager = new CookieManager(Config)
    this.request = null
    this.response = null
    this.cookieJar = {}
  }

  /**
   * Returns values from the cookie only after validating
   * the session id
   *
   * @param   {String}              sessionId
   * @param   {Object}              sessionValues
   *
   * @return  {Object}
   *
   * @private
   */
  _validateAndGetValues (sessionId, sessionValues) {
    if (_.get(sessionValues, 'sessionId') === sessionId && _.get(sessionValues, 'data')) {
      return _.get(sessionValues, 'data')
    }
    return {}
  }

  /**
   * Returns the value cookies from the request headers
   *
   * @param   {String}            sessionId
   *
   * @return  {Object}
   *
   * @private
   */
  _fetchRequestCookie (sessionId) {
    if (!_.size(this.cookieJar)) {
      const sessionValues = this.cookieManager.read(this.request, this.cookieName)
      this.cookieJar = this._validateAndGetValues(sessionId, sessionValues)
    }
    return this.cookieJar
  }

  /**
   * returns session info for a given session id
   *
   * @param  {String} sessionId
   *
   * @return {Object}
   */
  * read (sessionId) {
    return this._fetchRequestCookie(sessionId)
  }

  /**
   * writes session values back to the cookie
   *
   * @param  {String} sessionId
   * @param  {Object} values
   *
   * @return {Boolean}
   */
  * write (sessionId, values) {
    this.cookieJar = values
    const sessionValues = {data: values, sessionId}
    this.cookieManager.set(this.request, this.response, this.cookieName, sessionValues)
  }

  /**
   * clears the session values cookie
   *
   * @return {Boolean}
   */
  * destroy () {
    this.cookieManager.remove(this.request, this.response, this.cookieName)
  }

  /**
   * called by session class to pass on the request
   * and response object.
   *
   * @param  {Object}   request
   * @param  {Object}   response
   */
  setRequest (request, response) {
    this.request = request
    this.response = response
  }

}

module.exports = Cookie
