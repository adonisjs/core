'use strict'

class Admin {
  *handle(request, response, next) {
    if (request.headers().framework === 'adonis') {
      yield next;
    }
  }
}

  module.exports = Admin
