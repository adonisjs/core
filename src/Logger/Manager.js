'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc } = require('adonis-fold')
const Drivers = require('./Drivers')
const Logger = require('./index')
const CE = require('../Exceptions')

/**
 * Proxy handler to proxy logger instance
 * methods
 *
 * @type {Object}
 */
const proxyHandler = {
  get (target, name) {
    if (target[name]) {
      return target[name]
    }
    const driverInstance = target.driver(target._defaultDriver)
    return driverInstance[name].bind(driverInstance)
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
 *
 * @class LoggerManager
 */
class LoggerManager {
  constructor (Config) {
    this._defaultDriver = Config.get('app.logger.driver', 'console')
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
   * @param  {String}        name
   *
   * @return {Object}
   *
   * @private
   */
  _getInstanceFor (name) {
    if (Drivers[name]) {
      return new Logger(ioc.make(Drivers[name]))
    }

    if (this.constructor._drivers[name]) {
      return new Logger(this.constructor._drivers[name])
    }

    throw CE.RuntimeException.invalidLoggerDriver(name)
  }

  /**
   * Returns logger instance for a specific driver. Also
   * drivers pool will be created to re-use the existing
   * instances
   *
   * @method driver
   *
   * @param  {String} name
   *
   * @return {Object}
   *
   * @throws {RuntimeException} If driver does not exists
   */
  driver (name) {
    if (!this._loggerInstances[name]) {
      this._loggerInstances[name] = this._getInstanceFor(name)
    }
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
