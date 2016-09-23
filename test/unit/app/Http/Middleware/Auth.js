'use strict'

class Auth {

  * handle (request, response, next) {
    request.count++
    yield next
  }

}

module.exports = Auth
