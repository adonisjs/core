'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * @class Server.MiddlewareWrapper
 */
class MiddlewareWrapper {
  constructor (namespace) {
    this.namespace = namespace
  }

  /**
   * Returns the handler for the namespace. If namespace
   * is a function then return it as it is, otherwise
   * append `.handle` to the namespace, which is
   * the default method for middleware handler.
   *
   * @method getHandler
   *
   * @return {String|Function}
   */
  getHandler () {
    return typeof (this.namespace) === 'function' ? this.namespace : `${this.namespace}.handle`
  }

  /**
   * Global middleware have no runtime args
   *
   * @method getArgs
   *
   * @return {Array}
   */
  getArgs () {
    return []
  }
}

module.exports = MiddlewareWrapper
