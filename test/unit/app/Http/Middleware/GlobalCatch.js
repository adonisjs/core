'use strict'

class GlobalCatch {

  * handle (request, response, next) {
    response.status(401).send('Login')
  }
}

module.exports = GlobalCatch
