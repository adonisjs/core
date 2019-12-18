/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * Http exception handler serves as the base exception handler
 * to handle all exceptions occured during the HTTP request
 * lifecycle and makes appropriate response for them.
 */
export abstract class HttpExceptionHandler extends Macroable {
  /**
   * An array of error codes that must not be reported
   */
  protected dontReport: string[] = []

  /**
   * An array of http statuses that must not be reported. The first
   * level of filteration is on the basis of statuses and then
   * the error codes.
   */
  protected ignoreStatuses: number[] = [400, 422, 401]

  /**
   * An array of internal error codes to ignore
   * from the reporting list
   */
  protected internalDontReport: string[] = [
    'E_ROUTE_NOT_FOUND',
  ]

  /**
   * Map of status pages to render, instead of making the
   * regular response
   */
  protected statusPages: { [key: string]: string } = {}

  /**
   * Map of status pages for after expanding the expressions
   * defined inside statusPages.
   *
   * This property is initialized using the getter defined at
   * the end of this file
   */
  public expandedStatusPages: { [key: string]: string }

  /**
   * A flag to disable status pages during development
   */
  protected disableStatusPagesInDevelopment: boolean = true

  /**
   * Required by macroable
   */
  protected _getters = {}
  protected _macros = {}

  constructor (protected logger: LoggerContract) {
    super()
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

    ctx.response.status(error.status).send({ message: error.message })
  }

  /**
   * Makes the HTML response, based upon the environment in
   * which the app is runing
   */
  protected async makeHtmlResponse (error: any, ctx: HttpContextContract) {
    if (
      process.env.NODE_ENV === 'development' &&
      (!this.expandedStatusPages[error.status] || this.disableStatusPagesInDevelopment)
    ) {
      const Youch = require('youch')
      const html = await new Youch(error, ctx.request.request).toHTML()
      ctx.response.status(error.status).send(html)
      return
    }

    /**
     * Render status pages
     */
    if (ctx['view'] && this.expandedStatusPages[error.status]) {
      const html = ctx['view'].render(this.expandedStatusPages[error.status], { error })
      ctx.response.status(error.status).send(html)
      return
    }

    ctx.response.status(error.status).send(`<h1> ${error.message} </h1>`)
  }

  /**
   * Report a given error
   */
  public report (error: any, ctx: HttpContextContract) {
    error.status = error.status || 500

    if (!this.shouldReport(error)) {
      return
    }

    if (typeof (error.report) === 'function') {
      error.report(error, ctx)
      return
    }

    /**
     * - Using `error` for `500 and above`
     * - `warn` for `400 and above`
     * - `info` for rest. This should not happen, but technically it's possible for someone
     *    to raise with 200
     */
    const loggerFn: keyof LoggerContract = error.status >= 500
      ? 'error'
      : (error.status >= 400) ? 'warn' : 'info'

    this.logger[loggerFn](this.context(ctx), error.message)
  }

  /**
   * Handle exception and make response
   */
  public async handle (error: any, ctx: HttpContextContract) {
    error.status = error.status || 500

    if (typeof (error.handle) === 'function') {
      return error.handle(error, ctx)
    }

    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return this.makeJSONResponse(error, ctx)
    }

    return this.makeHtmlResponse(error, ctx)
  }
}

/**
 * Single getter to pull status pages after expanding the range expression
 */
HttpExceptionHandler.getter('expandedStatusPages', function expandedStatusPages () {
  return Object.keys(this.statusPages).reduce((result: any, codeRange: string) => {
    const parts = codeRange.split('.')
    const min = Number(parts[0])
    const max = Number(parts[parts.length - 1])

    if (isNaN(min) || isNaN(max)) {
      return result
    }

    if (min === max) {
      result[codeRange] = this.statusPages[codeRange]
    }

    Array.apply(null, new Array((max - min) + 1)).forEach((_v, step) => {
      result[min + step] = this.statusPages[codeRange]
    })

    return result
  }, {})
}, true)
