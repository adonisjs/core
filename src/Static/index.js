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
    this.publicPath = Helpers.publicPath()

    const options = {
      lastModified: Config.get('static.lastModified', true),
      maxAge: Config.get('static.cache', 3600),
      index: Config.get('static.indexFile', 'index.html'),
      fallthrough: false,
      etag: Config.get('static.etag', true)
    }

    this.server = serveStatic(this.publicPath, options)
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
      this.server(request, response, function (err, good) {
        if (err) {
          err.message = `Route ${err.message} while resolving ${request.url}`
          reject(err)
          return
        }
        resolve(good)
      })
    })
  }

}

module.exports = Static
