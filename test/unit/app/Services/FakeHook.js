'use strict'

class FakeHook {

  static get IocHooks () {
    return ['extend']
  }

  static get foo () {
    this.called = true
  }

}

module.exports = FakeHook
