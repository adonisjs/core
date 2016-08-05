'use strict'

class Cycle2 {

  * handle (request, response, next) {
    request.count++
    yield next
  }

}

module.exports = Cycle2
