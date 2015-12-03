'use strict'

class Service {

  static get inject() {
    return ['App/Services/Baz']
  }

  constructor( Baz) {
    this.baz = Baz.baz
    this.bar = Baz.bar
  }

}

module.exports = Service
