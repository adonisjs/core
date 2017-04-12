'use strict'

class Cycle {
  * handle (request, response, next) {
    request.count++
  }
}

module.exports = Cycle
