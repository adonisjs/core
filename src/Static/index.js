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
  serve (request, response, done) {
    this.server.serve(request, response, done)
  }

}

module.exports = Static
