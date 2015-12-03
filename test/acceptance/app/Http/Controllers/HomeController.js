'use strict'

class HomeController {

  * index (request, response) {
    response.send('Hello zombie via controller')
  }

  * cookies (request, response) {
    response.cookie('cart', {price:20,items:2}).send('');
  }

  * redirect (request, response) {
    response.route('profile', {id:2});
  }

  * profile (request, response) {
    response.send(request.param('id'));
  }

}

module.exports = HomeController
