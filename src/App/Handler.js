'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Default exception handler to handle all exceptions
 * thrown during HTTP request lifecycle. Once you
 * create a custom exception handler then class
 * won't be used to handle exceptions.
 *
 * @binding Adonis/Exceptions/Handler
 * @group Http
 *
 * @class Handler
 */
class Handler {
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
   * The handle method called by Adonis server to handle
   * exceptions
   *
   * @method handle
   * @async
   *
   * @param  {Object} error              - The error object
   * @param  {Object} options.request    - Current request object
   * @param  {Object} options.response   - Current response object
   *
   * @return {void}
   */
  async handle (error, { request, response }) {
    const isJSON = request.accepts(['html', 'json']) === 'json'

    if (process.env.NODE_ENV === 'development') {
      const formattedError = await this._getYouchError(error, request.request, isJSON)
      response.status(error.status).send(formattedError)
      return
    }

    response.status(error.status).send(this._getPlainError(error, isJSON))
  }
}

module.exports = Handler
