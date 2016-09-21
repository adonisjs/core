'use strict'

class Global {

  * handle (request, response, next) {
    request.count = 2
    yield next
  }

}

module.exports = Global
