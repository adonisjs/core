/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HttpContextContract } from '@adonisjs/server'
import { LoggerContract } from '../Contracts/Logger'
import { HttpExceptionHandlerContract } from '../Contracts/HttpExceptionHandler'

/**
 * Http exception handler serves as the base exception handler
 * to handle all exceptions occured during the HTTP request
 * lifecycle and makes appropriate response for them.
 */
export abstract class HttpExceptionHandler implements HttpExceptionHandlerContract {
  /**
   * Inject logger as a dependency to constructor
   */
  static get inject () {
    return ['Adonis/Src/Logger']
  }

  /**
   * An array of error codes that must not
   * be reported
   */
  protected dontReport: string[] = []

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
      requestId: ctx.request['id'],
    }
  }

  /**
   * Returns a boolean telling if a given error is supposed
   * to be logged or not
   */
  protected shouldReport (error: any): boolean {
    if (error.code && this.dontReport.indexOf(error.code) > -1) {
      return false
    }

    if (error.code && this.internalDontReport.indexOf(error.code) > -1) {
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
