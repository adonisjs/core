'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const path = require('path')
const Winston = require('winston')

/**
 * @module Adonis
 * @submodule framework
 */

/**
 * Winston console transport driver for {{#crossLink "Logger"}}{{/crossLink}}
 * All the logs will be written to the filename defined inside config.
 *
 * @class WinstonFile
 * @constructor
 */
class WinstonFile {
  /**
   * Returns an array of dependencies to be injected
   * by IoC container.
   *
   * @method inject
   * @static
   *
   * @return {Array}
   */
  static get inject () {
    return ['Adonis/Src/Config', 'Adonis/Src/Helpers']
  }

  constructor (Config, Helpers) {
    /**
     * Merging user config with defaults.
     */
    this.config = Config.merge('app.logger.file', {
      name: 'adonis-app',
      filename: 'adonis.log',
      level: 'info'
    })

    /**
     * If filename is not absolute, save it inside the tmp path
     * of adonis-app.
     */
    if (!path.isAbsolute(this.config.filename)) {
      this.config.filename = Helpers.tmpPath(this.config.filename)
    }

    /**
     * Creating new instance of winston with file transport
     */
    this.logger = new Winston.Logger({
      transports: [new Winston.transports.File(this.config)]
    })

    /**
     * Updating winston levels with syslog standard levels.
     */
    this.logger.setLevels(this.levels)
  }

  /**
   * A list of available log levels.
   *
   * @attribute levels
   *
   * @return {Object}
   */
  get levels () {
    return {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7
    }
  }

  /**
   * Returns the current level for the driver
   *
   * @attribute level
   *
   * @return {String}
   */
  get level () {
    return this.logger.transports[this.config.name].level
  }

  /**
   * Update driver log level at runtime
   *
   * @param  {String} level
   *
   * @return {void}
   */
  set level (level) {
    this.logger.transports[this.config.name].level = level
  }

  /**
   * Log message for a given level
   *
   * @method log
   *
   * @param  {Number}    level
   * @param  {String}    msg
   * @param  {...Spread} meta
   *
   * @return {void}
   */
  log (level, msg, ...meta) {
    const levelName = _.findKey(this.levels, (num) => {
      return num === level
    })
    this.logger.log(levelName, msg, ...meta)
  }
}

module.exports = WinstonFile
