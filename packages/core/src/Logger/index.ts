/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as pino from 'pino'
import { LoggerContract, LoggerLevels, LoggerConfig } from '../Contracts/Logger'

/**
 * Logger class it used to log messages from the application. The
 * logger internally uses [pino](http://getpino.io) which is
 * an extremely past logger.
 *
 * The logger implementation is really fast, coz it avoids formatting
 * the logs within the same process. It always output JSON, which
 * can be read by the [pino transports](http://getpino.io/#/docs/transports)
 * to format and send them to any external service.
 */
export class Logger implements LoggerContract {
  private _pino: any

  constructor (options: LoggerConfig) {
    const pinoOptions = Object.assign({}, options)
    const destination = options.logDestination

    /**
     * Swap property names
     */
    if (options.levelLabelKey) {
      pinoOptions['changeLevelName'] = options.levelLabelKey
    }

    /**
     * Instantiate logger
     */
    this._pino = pino(
      pinoOptions,
      typeof (destination) === 'function' ? destination(pino) : undefined,
    )
  }

  /**
   * Returns a copy of levels and their labels
   */
  public get levels (): LoggerLevels {
    return this._pino.levels
  }

  /**
   * The current level of the logger
   */
  public get level (): string {
    return this._pino.level
  }

  /**
   * Log message for any named level
   */
  public log (level: string, message: string, ...values: any[]): void
  public log (level: string, mergingObject: any, message: string, ...values: any[]): void
  public log (level: string, mergingObject: any, message: string, ...values: any[]): void {
    if (values.length) {
      this._pino[level](mergingObject, message, ...values)
    } else if (message) {
      this._pino[level](mergingObject, ...message)
    } else {
      this._pino[level](mergingObject)
    }
  }

  /**
   * Log message at trace level
   */
  public trace (message: string, ...values: any[]): void
  public trace (mergingObject: any, message: string, ...values: any[]): void {
    this.log('trace', mergingObject, message, ...values)
  }

  /**
   * Log message at debug level
   */
  public debug (message: string, ...values: any[]): void
  public debug (mergingObject: any, message: string, ...values: any[]): void {
    this.log('debug', mergingObject, message, ...values)
  }

  /**
   * Log message at info level
   */
  public info (message: string, ...values: any[]): void
  public info (mergingObject: any, message: string, ...values: any[]): void {
    this.log('info', mergingObject, message, ...values)
  }

  /**
   * Log message at warn level
   */
  public warn (message: string, ...values: any[]): void
  public warn (mergingObject: any, message: string, ...values: any[]): void {
    this.log('warn', mergingObject, message, ...values)
  }

  /**
   * Log message at error level
   */
  public error (message: string, ...values: any[]): void
  public error (mergingObject: any, message: string, ...values: any[]): void {
    this.log('error', mergingObject, message, ...values)
  }

  /**
   * Log message at fatal level
   */
  public fatal (message: string, ...values: any[]): void
  public fatal (mergingObject: any, message: string, ...values: any[]): void {
    this.log('fatal', mergingObject, message, ...values)
  }

  /**
   * Check if certain named level is enabled
   */
  public isLevelEnabled (level: string): boolean {
    return this._pino.isLevelEnabled(level)
  }
}
