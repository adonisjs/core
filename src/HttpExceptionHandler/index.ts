/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * Http exception handler serves as the base exception handler
 * to handle all exceptions occured during the HTTP request
 * lifecycle and makes appropriate response for them.
 */
export abstract class HttpExceptionHandler {
  /**
   * An array of error codes that must not be reported
   */
  protected ignoreCodes: string[] = []

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
  protected internalIgnoreCodes: string[] = ['E_ROUTE_NOT_FOUND']

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

  constructor(protected logger: LoggerContract) {}

  /**
   * A custom context to send to the logger when reporting
   * errors.
   */
  protected context(ctx: HttpContextContract): any {
    const requestId = ctx.request.id()
    return requestId
      ? {
          'x-request-id': requestId,
        }
      : {}
  }

  /**
   * Returns a boolean telling if a given error is supposed
   * to be logged or not
   */
  protected shouldReport(error: any): boolean {
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
    if (error.code && this.ignoreCodes.concat(this.internalIgnoreCodes).indexOf(error.code) > -1) {
      return false
    }

    return true
  }

  /**
   * Makes the JSON response, based upon the environment in
   * which the app is runing
   */
  protected async makeJSONResponse(error: any, ctx: HttpContextContract) {
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
   * Makes the JSON API response, based upon the environment in
   * which the app is runing
   */
  protected async makeJSONAPIResponse(error: any, ctx: HttpContextContract) {
    ctx.response.status(error.status).send({
      errors: [
        {
          title: error.message,
          ...(process.env.NODE_ENV === 'development' ? { detail: error.stack } : {}),
          code: error.code,
          status: error.status,
        },
      ],
    })
  }

  /**
   * Makes the HTML response, based upon the environment in
   * which the app is runing
   */
  protected async makeHtmlResponse(error: any, ctx: HttpContextContract) {
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
      const html = await ctx['view'].render(this.expandedStatusPages[error.status], { error })
      ctx.response.status(error.status).send(html)
      return
    }

    ctx.response.status(error.status).send(`<h1> ${error.message} </h1>`)
  }

  /**
   * Report a given error
   */
  public report(error: any, ctx: HttpContextContract) {
    error.status = error.status || 500

    if (!this.shouldReport(error)) {
      return
    }

    if (typeof error.report === 'function') {
      error.report(error, ctx)
      return
    }

    /**
     * - Using `error` for `500 and above`
     * - `warn` for `400 and above`
     * - `info` for rest. This should not happen, but technically it's possible for someone
     *    to raise with 200
     */
    if (!error.status || error.status >= 500) {
      if (process.env.NODE_ENV !== 'test') {
        ctx.logger.error({ err: error, ...this.context(ctx) }, error.message)
      }
    } else if (error.status >= 400) {
      ctx.logger.warn(this.context(ctx), error.message)
    } else {
      ctx.logger.info(this.context(ctx), error.message)
    }
  }

  /**
   * Handle exception and make response
   */
  public async handle(error: any, ctx: HttpContextContract) {
    error.status = error.status || 500

    if (typeof error.handle === 'function') {
      return error.handle(error, ctx)
    }

    /**
     * Send stack in the response when in test environment and
     * there is a fatal error.
     */
    if (error.status >= 500 && error.stack && process.env.NODE_ENV === 'test') {
      return ctx.response.status(error.status).send(error.stack)
    }

    /**
     * Attempt to find the best error reporter for validation
     */
    switch (ctx.request.accepts(['html', 'application/vnd.api+json', 'json'])) {
      case 'html':
      case null:
        return this.makeHtmlResponse(error, ctx)
      case 'json':
        return this.makeJSONResponse(error, ctx)
      case 'application/vnd.api+json':
        return this.makeJSONAPIResponse(error, ctx)
    }
  }
}

/**
 * Single getter to pull status pages after expanding the range expression
 */
Object.defineProperty(HttpExceptionHandler.prototype, 'expandedStatusPages', {
  get() {
    const value = Object.keys(this.statusPages).reduce((result: any, codeRange: string) => {
      const parts = codeRange.split('.')
      const min = Number(parts[0])
      const max = Number(parts[parts.length - 1])

      if (isNaN(min) || isNaN(max)) {
        return result
      }

      if (min === max) {
        result[codeRange] = this.statusPages[codeRange]
      }

      Array.apply(null, new Array(max - min + 1)).forEach((_: number, step: number) => {
        result[min + step] = this.statusPages[codeRange]
      })

      return result
    }, {})

    Object.defineProperty(this, 'expandedStatusPages', { value })
    return value
  },
})
