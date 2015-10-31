'use strict'

class HomeController {

  * index (request, response) {
    response.send("Hello via controller")
  }

  * counter (request, response) {
    response.send(request.counter)
  }

  * cookie (request, response) {
    response.cookie('name','virk').end()
  }

  * redirect (request, response) {
    response.route('profile', {id:1})
  }

  * profile (request, response) {
    response.send(request.param("id"))
  }

}

module.exports = HomeController
