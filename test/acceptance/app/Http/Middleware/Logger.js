'use strict'

class Logger {

  * handle (request, response, next) {
    const start = new Date().getTime()
    yield next
    const elapsed = new Date().getTime() - start
    response.send(elapsed)
  }

}

module.exports = Logger
