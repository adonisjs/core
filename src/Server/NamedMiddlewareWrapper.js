'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
const haye = require('haye')
const GE = require('@adonisjs/generic-exceptions')

/**
 * @class Server.NamedMiddlewareWrapper
 */
class NamedMiddlewareWrapper {
  constructor (middleware, namedHash) {
    if (typeof (middleware) === 'function') {
      this.namespace = middleware
      this.args = []
      return
    }

    const [{ name, args }] = haye.fromPipe(middleware).toArray()

    /**
     * Throw exception when unable to find namespace for the
     * defined named middleware. The user is supposed to
     * define them inside `start/kernel.js` file.
     */
    if (!namedHash[name]) {
      const message = `Cannot find any named middleware for {${name}}. Make sure you have registered it inside start/kernel.js file.`

      throw GE.RuntimeException.invoke(message, 500, 'E_MISSING_NAMED_MIDDLEWARE')
    }

    this.namespace = namedHash[name]
    this.args = [args]
  }

  /**
   * Returns the handler for the named middleware. If handler
   * is a function then returned as it is, other namspace
   * string is returned with `.handle` appended to it.
   *
   * @method getHandler
   *
   * @return {String|Function}
   */
  getHandler () {
    return typeof (this.namespace) === 'function' ? this.namespace : `${this.namespace}.handle`
  }

  /**
   * Any runtime arguments for middleware
   *
   * @method getArgs
   *
   * @return {Array}
   */
  getArgs () {
    return this.args
  }
}

module.exports = NamedMiddlewareWrapper
