'use strict'

class AuthMiddleware {

  * handle (request, response, next, scheme) {
    request.scheme = scheme
    yield next
  }

}

module.exports = AuthMiddleware
