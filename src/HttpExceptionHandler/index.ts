/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerContract } from '@poppinss/logger'
import { HttpContextContract } from '@poppinss/http-server'

/**
 * Http exception handler serves as the base exception handler
 * to handle all exceptions occured during the HTTP request
 * lifecycle and makes appropriate response for them.
 */
export abstract class HttpExceptionHandler {
  /**
   * Inject logger as a dependency to constructor
   */
  static get inject () {
    return {
      instance: ['Adonis/Core/Logger'],
    }
  }

  /**
   * An array of error codes that must not be reported
   */
  protected dontReport: string[] = []

  /**
   * An array of http statuses that must not be reported. The first
   * level of filteration is not on the basis on statuses and then
   * the error codes.
   */
  protected ignoreStatuses: number[] = []

  /**
   * An array of internal error codes to ignore
   * from the reporting list
   */
  protected internalDontReport: string[] = [
    'E_ROUTE_NOT_FOUND',
  ]

  constructor (protected logger: LoggerContract) {
  }

  /**
   * A custom context to send to the logger when reporting
   * errors.
   */
  protected context (ctx: HttpContextContract): any {
    return {
      'x-request-id': ctx.request.id(),
    }
  }

  /**
   * Returns a boolean telling if a given error is supposed
   * to be logged or not
   */
  protected shouldReport (error: any): boolean {
    /**
     * Do not report the error when it's status is mentioned inside
     * the `ignoreStatuses` array.
     */
    if (error.status && this.ignoreStatuses.indexOf(error.status) > -1) {
      return false
    }

    /**
     * Don't report when error has a code and it's in the ignore list.
     */
    if (error.code && this.dontReport.concat(this.internalDontReport).indexOf(error.code) > -1) {
      return false
    }

    return true
  }

  /**
   * Makes the JSON response, based upon the environment in
   * which the app is runing
   */
  protected async makeJSONResponse (error: any, ctx: HttpContextContract) {
    if (process.env.NODE_ENV === 'development') {
      ctx.response.status(error.status).send({
        message: error.message,
        stack: error.stack,
        code: error.code,
      })
      return
    }

    ctx.response.status(error.status).send({
      message: error.message,
    })
  }

  /**
   * Makes the HTML response, based upon the environment in
   * which the app is runing
   */
  protected async makeHtmlResponse (error: any, ctx: HttpContextContract) {
    if (process.env.NODE_ENV === 'development') {
      const Youch = require('youch')
      const html = await new Youch(error, ctx.request.request).toHTML()
      ctx.response.status(error.status).send(html)
      return
    }

    ctx.response.status(error.status).send(`<h1> ${error.message} </h1>`)
  }

  /**
   * Report a given error
   */
  public report (error: any, ctx: HttpContextContract) {
    if (!this.shouldReport(error)) {
      return
    }

    if (typeof (error.report) === 'function') {
      error.report(error, ctx)
      return
    }

    this.logger.error(this.context(ctx), error.message)
  }

  /**
   * Handle exception and make response
   */
  public async handle (error: any, ctx: HttpContextContract) {
    error.status = error.status || 500

    if (typeof (error.handle) === 'function') {
      return error.handle(error, ctx)
    }

    if (ctx.request.accepts(['json'])) {
      return this.makeJSONResponse(error, ctx)
    }

    return this.makeHtmlResponse(error, ctx)
  }
}
