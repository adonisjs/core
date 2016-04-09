'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const serveStatic = require('serve-static')

/**
 * serves static files for a given directory
 * @class
 */
class Static {

  constructor (Helpers, Config) {
    const publicPath = Helpers.publicPath()
    const options = Config.get('app.static', {})
    options.fallthrough = false
    this.server = serveStatic(publicPath, options)
  }

  /**
   * serves static file for a given request url
   *
   * @param  {Object} request
   * @param  {Object} response
   * @return {Promise}
   *
   * @example
   * static
   *   .serve(req, res)
   *   .then()
   *   .catch()
   * @public
   */
  serve (request, response) {
    return new Promise((resolve, reject) => {
      this.server(request, response, (error) => {
        if (!error) {
          return resolve()
        }
        error.message = `Route ${error.message} while resolving ${request.url}`
        reject(error)
      })
    })
  }

}

module.exports = Static
