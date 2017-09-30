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
const GE = require('@adonisjs/generic-exceptions')
const Drivers = require('./Drivers')

/**
 * Logger manager is binded to IoC container as a manager, which
 * can be used to extend logger by adding your own drivers.
 *
 * @manager
 * @group Core
 * @binding Adonis/Src/Logger
 *
 * @class LoggerManager
 * @constructor
 */
class LoggerManager {
  constructor () {
    this._drivers = {}
  }

  /**
   * Extend logger by adding your own drivers
   *
   * @method extend
   *
   * @param  {String} name
   * @param  {Object} implementation
   *
   * @return {void}
   */
  extend (name, implementation) {
    this._drivers[name] = implementation
  }

  /**
   * Returns the driver instance for a given driver. Also
   * calls `setConfig` method on the driver to pass
   * the configuration
   *
   * @method driver
   *
   * @param  {String} name
   * @param  {Object} config
   *
   * @return {Object}
   */
  driver (name, config) {
    name = name.toLowerCase()
    const Driver = Drivers[name] || this._drivers[name]

    /**
     * If driver doesn't exists, let the end user know
     * about it
     */
    if (!Driver) {
      throw GE.RuntimeException.invoke(`Logger driver ${name} does not exists.`, 500, 'E_INVALID_LOGGER_DRIVER')
    }

    const driverInstance = ioc.make(Driver)
    driverInstance.setConfig(config)
    return driverInstance
  }
}

module.exports = new LoggerManager()
