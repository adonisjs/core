'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class Handler {
  /**
   * Returns error formatted by youch
   *
   * @method _getYouchError
   *
   * @param  {Object}       error
   * @param  {Object}       req
   * @param  {Boolean}      isJSON
   *
   * @return {Promise}
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
   * Returns plain error returned in production
   *
   * @method _getPlainError
   *
   * @param  {Object}       error
   * @param  {Boolean}      isJSON
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
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
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
