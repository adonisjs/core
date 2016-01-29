'use strict'

class GlobalCatch{

  * handle (request, response, next) {
    let error = new Error("Login")
    error.status = 401
    throw error
  }
}

module.exports = GlobalCatch
