'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

function HttpException () {
  // extending error class
  Error.call(this)

  this.name = 'HttpException'

  if (arguments.length === 2) {
    this.status = arguments[0]
    this.message = arguments[1]
  } else {
    this.status = 503
    this.message = arguments[0]
  }

}

module.exports = HttpException
