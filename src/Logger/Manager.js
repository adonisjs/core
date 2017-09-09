'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc } = require('@adonisjs/fold')
const Drivers = require('./Drivers')
const Logger = require('./index')
const GE = require('@adonisjs/generic-exceptions')

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
     * Fallback to driver instance
     */
    const loggerInstance = target.transport()

    if (typeof (loggerInstance[name]) === 'function') {
      return loggerInstance[name].bind(loggerInstance)
    }

    return loggerInstance[name]
  }
}

/**
 * Logger manager is used to manage, extend and
 * get logger instances for a given driver. By
 * default `default` driver is used. Which is
 * defined inside `config/app.js` file.
 *
 * @namespace Adonis/Src/Logger
 * @alias Logger
 * @singleton
 * @group Core
 *
 * @class LoggerManager
 */
class LoggerManager {
  constructor (Config) {
    this.Config = Config
    this._loggerInstances = {}

    return new Proxy(this, proxyHandler)
  }

  /**
   * Extend logger by adding your own drivers
   *
   * @method extend
   * @static
   *
   * @param  {String} name
   * @param  {Object} implementation
   *
   * @return {void}
   */
  static extend (name, implementation) {
    this._drivers[name] = implementation
  }

  /**
   * Returns instance for in-built or extended driver, based
   * upon the name
   *
   * @method _getInstanceFor
   *
   * @param  {Object}        transportConfig
   *
   * @return {Logger}
   *
   * @private
   */
  _getInstanceFor (transportConfig) {
    const driver = transportConfig.driver
    const Driver = Drivers[driver] || this.constructor._drivers[driver]

    if (!Driver) {
      throw GE.RuntimeException.invoke(`Logger driver ${driver} does not exists.`, 500, 'E_INVALID_LOGGER_DRIVER')
    }

    const driverInstance = ioc.make(Driver)
    driverInstance.setConfig(transportConfig)

    return new Logger(driverInstance)
  }

  /**
   * Returns logger instance for a specific transport. Also
   * drivers pool will be created to re-use the existing
   * instances
   *
   * @method transport
   *
   * @param  {String} name
   *
   * @return {Object}
   *
   * @throws {RuntimeException} If driver does not exists
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

    this._loggerInstances[name] = this._getInstanceFor(transportConfig)
    return this._loggerInstances[name]
  }
}

/**
 * A hash of extended drivers
 *
 * @type {Object}
 */
LoggerManager._drivers = {}

module.exports = LoggerManager
