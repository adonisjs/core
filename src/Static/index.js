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

  constructor (Helpers) {
    this.publicPath = Helpers.publicPath()
    this.server = new nodeStatic.Server(this.publicPath)
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
        if(err) {
          err.message = err.message || 'Unknown error'
          err.message = `${err.message} while resolving ${request.url}`
          reject(err)
          return
        }
        resolve(good)
      })
    })
  }

}

module.exports = Static
