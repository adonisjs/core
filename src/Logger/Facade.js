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
const LoggerManager = require('./Manager')
const Logger = require('./index')

/**
 * Proxy handler to proxy logger instance
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
     * Fallback to default transport instance
     */
    const tranportInstance = target.transport()
    if (typeof (tranportInstance[name]) === 'function') {
      return tranportInstance[name].bind(tranportInstance)
    }
    return tranportInstance[name]
  },

  set (target, name, value) {
    const tranportInstance = target.transport()
    tranportInstance.level = value
    return true
  }
}

/**
 * LoggerFacade is exposed by IoC container and it proxy
 * methods over @ref('Logger') class.
 *
 * @group Core
 * @binding Adonis/Src/Logger
 * @alias Logger
 *
 * @class LoggerFacade
 * @constructor
 */
class LoggerFacade {
  constructor (Config) {
    this.Config = Config
    this._loggerInstances = {}
    return new Proxy(this, proxyHandler)
  }

  /**
   * Returns the @ref('Logger') class instance for a given
   * transport.
   *
   * @method transport
   *
   * @param  {String}  name
   *
   * @return {Logger}
   */
  transport (name) {
    name = name || this.Config.get('app.logger.transport')

    /**
     * Throw exception when logger.transport is not defined
     */
    if (!name) {
      throw GE.RuntimeException.missingConfig('logger.transport', 'config/app.js')
    }

    /**
     * Return existing instance if exists
     */
    if (this._loggerInstances[name]) {
      return this._loggerInstances[name]
    }

    const transportConfig = this.Config.get(`app.logger.${name}`)

    /**
     * Throw exception if there is no config defined for the
     * given logger name
     */
    if (!transportConfig) {
      throw GE.RuntimeException.missingConfig(`logger.${name}`, 'config/app.js')
    }

    /**
     * Throw exception when no driver is defined
     * on the transport config
     */
    if (!transportConfig.driver) {
      throw GE.RuntimeException.incompleteConfig(`logger.${name}`, ['driver'], 'config/app.js')
    }

    const driverInstance = LoggerManager.driver(transportConfig.driver, transportConfig)
    this._loggerInstances[name] = new Logger(driverInstance)

    return this._loggerInstances[name]
  }
}

module.exports = LoggerFacade
