'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

class HttpException extends Error {

  constructor () {
    let message = null
    let status = 503

    if (arguments.length === 2) {
      status = arguments[0]
      message = arguments[1]
    } else {
      message = arguments[0]
    }

    super(message)

    this.status = status

    Object.defineProperty(this, 'name', {
      enumerable: false,
      value: this.constructor.name
    })

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor)
    } else {
      Object.defineProperty(this, 'stack', {
        enumerable: false,
        value: (new Error(message)).stack
      })
    }
  }

}

module.exports = HttpException
