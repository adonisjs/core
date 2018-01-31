'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ExceptionStore = require('./index')

class BaseExceptionHandler {
  /**
   * Returns error formatted by youch
   *
   * @method _getYouchError
   * @async
   *
   * @param  {Object}       error  - The error object
   * @param  {Object}       req    - Current request object
   * @param  {Boolean}      isJSON - Does response has to be in JSON
   *
   * @return {Html|Object}
   *
   * @private
   */
  _getYouchError (error, req, isJSON) {
    const Youch = require('youch')
    const youch = new Youch(error, req)
    if (isJSON) {
      return youch.toJSON()
    }
    return youch.toHTML()
  }

  /**
   * Returns plain error to be used when running
   * server in production. Since production
   * server should not show error stack.
   *
   * @method _getPlainError
   *
   * @param  {Object}       error  - The error object
   * @param  {Boolean}      isJSON - Does response has to be in JSON
   *
   * @return {Object}
   *
   * @private
   */
  _getPlainError (error, isJSON) {
    return isJSON ? {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status
    } : `${error.name}: ${error.message}`
  }

  /**
   * The default handler to report exception when no one handles
   * a given exception
   *
   * @method _defaultHandler
   *
   * @param  {Object}        error
   * @param  {Object}        options.request
   * @param  {Object}        options.response
   *
   * @return {void}
   *
   * @private
   */
  async _defaultHandler (error, { request, response }) {
    const isJSON = request.accepts(['html', 'json']) === 'json'

    if (process.env.NODE_ENV === 'development') {
      const formattedError = await this._getYouchError(error, request.request, isJSON)
      response.status(error.status).send(formattedError)
      return
    }

    response.status(error.status).send(this._getPlainError(error, isJSON))
  }

  /**
   * Handles the exception by sending a response
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} ctx
   *
   * @return {Mixed}
   */
  handle (error, ctx) {
    if (typeof (error.handle) === 'function') {
      return error.handle(error, ctx)
    }

    const customHandler = ExceptionStore.getHandler(error.name)
    if (customHandler && typeof (customHandler.method) === 'function') {
      return customHandler.method(error, ctx)
    }

    return this._defaultHandler(error, ctx)
  }

  /**
   * Reports the error by invoking report on the exception
   * or pulls a custom defined reporter
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} ctx
   *
   * @return {void}
   */
  report (error, ctx) {
    if (typeof (error.report) === 'function') {
      return error.report(error, ctx)
    }

    const customReporter = ExceptionStore.getReporter(error.name)
    if (customReporter && typeof (customReporter.method) === 'function') {
      return customReporter.method(error, ctx)
    }
  }
}

module.exports = BaseExceptionHandler
