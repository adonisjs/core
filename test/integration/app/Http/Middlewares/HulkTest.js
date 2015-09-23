'use strict'

const HttpException = require('../../../../../src/HttpException')

class HulkTest {
  * handle( request, response, next) {
    if (request.headers().color && request.headers().color === 'green') {
      yield next
    } else {
      throw new HttpException(400, 'Hulk should be green')
    }
  }
}

module.exports = HulkTest
