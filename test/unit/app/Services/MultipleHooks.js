'use strict'

class Bar {
  static transform () {
    return 'newBar'
  }
}

class MultipleHooks {

  static get hooks () {
    return ['extend', 'transform']
  }

  static extend () {
    return Bar
  }
}

module.exports = MultipleHooks
