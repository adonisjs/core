'use strict'

class Counter {

  constructor () {
    this.counter = "2"
  }

  * handle (request, response, next) {
    request.counter = this.counter
    yield next
  }

}

module.exports = Counter
