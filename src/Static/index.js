'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const serveStatic = require('serve-static')

/**
 * @class  Static
 * @description serves the purpose of serving static files
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
   * @description serves static file based upon
   * request url
   * @method serve
   * @param  {Object} request
   * @param  {Object} response
   * @param  {Function} done
   * @return {void}
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
