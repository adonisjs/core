'use strict'

class Baz {

  static get inject() {
    return ['App/Services/Bar']
  }

  constructor( Bar) {
    this.bar = Bar.bar
    this.baz = 'baz'
  }

}

module.exports = Baz
