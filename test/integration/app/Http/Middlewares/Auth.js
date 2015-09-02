'use strict'

class Auth {

  *handle(request, response, next) {
    if (request.headers().framework) {
      yield next;
    }
  }

}

module.exports = Auth
