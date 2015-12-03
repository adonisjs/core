'use strict'

class UserController {

  static get inject() {
    return ['App/Providers/Foo', 'App/modules/time']
  }

  constructor( Foo, Time) {
    this.foo = Foo
    this.time = Time
  }

  hello() {
    return 'hello world'
  }

}

module.exports = UserController
