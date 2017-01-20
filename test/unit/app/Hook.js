'use strict'

class Hook {

  static get IocHooks () {
    return ['extend']
  }

  static extend () {
    this.called = true
  }
}

module.exports = Hook
