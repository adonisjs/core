'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const GE = require('@adonisjs/generic-exceptions')
const HashManager = require('./Manager')
const Hash = require('./index')

/**
 * Proxy handler to proxy hash instance
 * methods
 *
 * @type {Object}
 */
const proxyHandler = {
  get (target, name) {
    /**
     * if node is inspecting then stick to target properties
     */
    if (typeof (name) === 'symbol' || name === 'inspect') {
      return target[name]
    }

    /**
     * if value exists on target, return that
     */
    if (typeof (target[name]) !== 'undefined') {
      return target[name]
    }

    /**
     * Fallback to default hasher instance
     */
    const hasherInstance = target.driver()
    if (typeof (hasherInstance[name]) === 'function') {
      return hasherInstance[name].bind(hasherInstance)
    }

    return hasherInstance[name]
  }
}

/**
 * HashFacade is exposed by IoC container and it proxy
 * methods over @ref('Hash') class.
 *
 * @group Hash
 * @binding Adonis/Src/Hash
 * @alias Hash
 *
 * @class HashFacade
 * @constructor
 */
class HashFacade {
  constructor (Config) {
    this.Config = Config
    this._hasherInstances = {}
    return new Proxy(this, proxyHandler)
  }

  /**
   * Returns the @ref('Hash') class instance for a given
   * driver.
   *
   * @method driver
   *
   * @param  {String}  name
   *
   * @return {Hash}
   */
  driver (name) {
    name = name || this.Config.get('hash.driver') || 'bcrypt'

    /**
     * Throw exception when hash.driver is not defined
     */
    if (!name) {
      throw GE.RuntimeException.missingConfig('driver', 'config/hash.js')
    }

    /**
     * Return existing instance if exists
     */
    if (this._hasherInstances[name]) {
      return this._hasherInstances[name]
    }

    const hasherConfig = this.Config.get(`hash.${name}`) || {}

    const driverInstance = HashManager.driver(name, hasherConfig)
    this._hasherInstances[name] = new Hash(driverInstance)

    return this._hasherInstances[name]
  }
}

module.exports = HashFacade
