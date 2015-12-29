'use strict'

class FakeHook {

  static get hooks () {
    return ['extend']
  }

  static get extend () {
    return 'bar'
  }

}

module.exports = FakeHook
