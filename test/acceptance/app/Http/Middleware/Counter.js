'use strict'

class Counter {

  * handle (request, response, next) {
    request.counter = 1
    yield next;
  }

}

module.exports = Counter
