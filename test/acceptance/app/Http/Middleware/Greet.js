'use strict'

class Greet {

  * handle (request, response, next) {
    response.status(200).send('Greetings!');
  }

}

module.exports = Greet
