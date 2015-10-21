'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeStatic = require('node-static')

class Static {

  constructor (Helpers) {
    this.publicPath = Helpers.publicPath()
    this.server = new nodeStatic.Server(this.publicPath)
  }

  serve (request, response) {
    this.server.serve(request, response)
  }

}

module.exports = Static
