'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nodeStatic = require('node-static')

/**
 * serves static files for a given directory
 * @class
 */
class Static {

  constructor (Helpers, Config) {
    this.publicPath = Helpers.publicPath()

    const options = {
      cache: Config.get('static.cache', 3600),
      serverInfo: 'adonis-static',
      headers: Config.get('static.headers', {}),
      gzip: Config.get('static.gzip', false),
      indexFile: Config.get('static.indexFile', 'index.html')
    }

    this.server = new nodeStatic.Server(this.publicPath, options)
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
      this.server.serve(request, response, function (err, good) {
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
