'use strict'

class UserController {

  * index (request, response) {
    response.send(request.count)
  }

}

module.exports = UserController
