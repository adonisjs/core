'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeStatic = require('node-static')

/**
 * @class  Static
 * @description serves the purpose of serving static files
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
