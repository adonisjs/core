'use strict'

class AppService {

  listUsers() {
    const users = [
      {
        name: 'virk'
      },
      {
        name: 'nikk'
      }
    ]
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(users)
      }, 100)
    })
  }

}

module.exports = AppService
