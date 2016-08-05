'use strict'

const ServiceProvider = require('../../../../').ServiceProvider

class Bar {
  constructor (foo) {
    this.bar = foo
  }
}

class BarProvider extends ServiceProvider {
  * register () {
    this.app.singleton('Providers/Bar', function (app) {
      const Foo = app.use('Providers/Foo')
      return new Bar(Foo)
    })
  }

  * boot () {
    const Bar = this.app.use('Providers/Bar')
    Bar.boot = true
  }
}

module.exports = BarProvider
