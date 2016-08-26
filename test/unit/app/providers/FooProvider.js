'use strict'

const ServiceProvider = require('../../../../').ServiceProvider

class Foo {
  constructor () {
    this.foo = 'bar'
  }
}

class FooProvider extends ServiceProvider {
  * register () {
    this.app.bind('Providers/Foo', function () {
      return new Foo()
    })
  }
}

module.exports = FooProvider
