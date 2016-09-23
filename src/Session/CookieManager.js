'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nodeCookie = require('node-cookie')

/**
 * Manages HTTP request cookies by using
 * right options as defined in config.
 * @class
 */
class CookieManager {

  /**
   * @constructor
   */
  constructor (Config) {
    this.appSecret = Config.get('app.appKey')
    this.shouldEncrypt = !!this.appSecret
    this.options = {
      domain: Config.get('session.domain'),
      path: Config.get('session.path', '/'),
      secure: Config.get('session.secure', false),
      httpOnly: Config.get('session.httpOnly', false),
      sameSite: Config.get('session.sameSite', false)
    }
    if (!Config.get('session.clearWithBrowser', false)) {
      this.options.expires = new Date(Date.now() + (Config.get('session.age', 120) * 60 * 1000))
    }
  }

  /**
   * sets cookie on a given HTTP request.
   *
   * @param {Object} request
   * @param {Object} response
   * @param {String} cookieName
   * @param {Mixed} value
   *
   * @return {Boolean}
   */
  set (request, response, cookieName, value) {
    return nodeCookie.create(request, response, cookieName, value, this.options, this.appSecret, this.shouldEncrypt)
  }

  /**
   * Returns value for a given cookie name from the
   * HTTP request.
   *
   * @param  {Object} request
   * @param  {String} cookieName
   *
   * @return {Mixed}
   */
  read (request, cookieName) {
    return nodeCookie.parse(request, this.appSecret, this.shouldEncrypt)[cookieName]
  }

  /**
   * Removes cookie from the HTTP request by setting
   * the expiry date in past.
   *
   * @param  {Object} request
   * @param  {Object} response
   * @param  {Stirng} cookieName
   *
   * @return {Boolean}
   */
  remove (request, response, cookieName) {
    return nodeCookie.clear(request, response, cookieName)
  }

}

module.exports = CookieManager
