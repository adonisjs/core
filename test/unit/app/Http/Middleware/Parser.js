'use strict'

class Parser {

  * handle (request, response, next) {
    request.count = 0
    yield next
  }

}

module.exports = Parser
