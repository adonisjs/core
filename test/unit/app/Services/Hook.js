'use strict'

class Hook {

  static get hooks () {
    return ['extend']
  }

  static extend () {
    return 'bar'
  }
}

module.exports = Hook
