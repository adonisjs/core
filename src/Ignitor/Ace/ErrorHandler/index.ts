/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Handles ignitor bootstrapping errors by pretty printing them in development
 */
export class ErrorHandler {
  constructor(private application: ApplicationContract) {}

  /**
   * Pretty prints a given error on the terminal
   */
  private async prettyPrintError(error: any) {
    try {
      const Youch = require('youch')
      const output = await new Youch(error, {}).toJSON()
      console.log(require('youch-terminal')(output))
    } catch (err) {
      console.log(error.stack)
    }
  }

  /**
   * Handles ignitor boot errors
   */
  public async handleError(error: any) {
    if (typeof error.handle === 'function') {
      error.handle(error)
    } else if (this.application.inDev) {
      await this.prettyPrintError(error)
    } else {
      console.error(error.stack)
    }
  }
}
