'use strict'

class FriendsController {

  getData() {
    let friendsToReturn = [
      {
        name: 'foo'
      },
      {
        name: 'bar'
      }
    ]

    return new Promise(function (resolve) {
      resolve(friendsToReturn)
    })
  }

  * index( request, response) {
    let friends = yield this.getData()
    response.status(200).send(friends)
  }
}

module.exports = FriendsController
