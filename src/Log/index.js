'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const CatLog = require('cat-log')
const Syslog = require('ain2')
const CE = require('../Exceptions')

/**
 * Manage application logs and sends them to syslog.
 */
class Log {
  constructor (Config) {
    this.syslog = new Syslog(Config.get('app.syslog'))
    this.log = new CatLog('adonis:framework', 'silly')
  }

  /**
   * here we send log to syslog
   *
   * @param  {String}    handler
   *
   * @private
   */
  _sendToSyslog (type, message) {
    const allowedTypes = ['log', 'info', 'warn', 'error', 'dir', 'time', 'trace', 'assert']

    if (allowedTypes.indexOf(type) === -1) {
      throw CE.InvalidArgumentException.invalidParameter('Invalid syslog log method type.')
    }

    this.syslog[type](message)
  }

  /**
   * log to console and syslog with info method
   *
   * @param  {String} message - Message to send to log
   *
   * @example
   * Log.info('Hey, this is info message for console and syslog')
   *
   * @public
   */
  info (message) {
    this._sendToSyslog('info', message)
    this.log.info(message)
  }

  /**
   * log to console and syslog with warn method
   *
   * @param  {String} message - Message to send to log
   *
   * @example
   * Log.warn('Hey, this is warn message for console and syslog')
   *
   * @public
   */
  warn (message) {
    this._sendToSyslog('warn', message)
    this.log.warn(message)
  }

  /**
   * log to console and syslog with error method
   *
   * @param  {String} message - Message to send to log
   *
   * @example
   * Log.error('Hey, this is error message for console and syslog')
   *
   * @public
   */
  error (message) {
    this._sendToSyslog('error', message)
    this.log.error(message)
  }

  /**
   * log to console and syslog with debug method
   *
   * @param  {String} message - Message to send to log
   *
   * @example
   * Log.debug('Hey, this is debug message for console and syslog')
   *
   * @public
   */
  debug (message) {
    this._sendToSyslog('info', message)
    this.log.debug(message)
  }

  /**
   * log to console and syslog with verbose method
   *
   * @param  {String} message - Message to send to log
   *
   * @example
   * Log.verbose('Hey, this is verbose message for console and syslog')
   *
   * @public
   */
  verbose (message) {
    this._sendToSyslog('info', message)
    this.log.verbose(message)
  }

  /**
   * log to console and syslog with silly method
   *
   * @param  {String} message - Message to silly to log
   *
   * @example
   * Log.silly('Hey, this is silly message for console and syslog')
   *
   * @public
   */
  silly (message) {
    this._sendToSyslog('info', message)
    this.log.silly(message)
  }
}

module.exports = Log
