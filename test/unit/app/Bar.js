
class Bar {
  static get inject () {
    return ['App/Foo']
  }

  constructor (foo) {
    this.foo = foo
  }
}

module.exports = Bar
