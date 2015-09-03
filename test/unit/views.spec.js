'use strict'

/*
|--------------------------------------------------------------------------
|  Response Tests
|--------------------------------------------------------------------------
|
|  Response makes use of nodeRes , which itself is tested so there is
|  no point testing it's expectations.
|
*/

const View = require('../../src/View/index')
const path = require('path')
const chai = require('chai')
const expect = chai.expect
const co = require('co')
const Ioc = require('adonis-fold').Ioc
let view = null

const Helpers = {
  viewsPath: function () {
    return path.join(__dirname, './views')
  }
}

describe('Views', function () {
  before(function () {
    view = new View(Helpers)
  })

  it('should compile views from a given directory ', function (done) {
    let text = '<h2> Hello world </h2>'

    co(function *() {
      return yield view.make('home')
    }).then(function (compiledView) {
      expect(compiledView.trim()).to.equal(text)
      done()
    }).catch(done)
  })

  it('should be able to use Ioc container bindings right inside the views', function (done) {
    class Foo {
      bar () {
        return 'bar'
      }
    }

    Ioc.bind('Views/Foo', function () {
      return new Foo()
    })

    co(function *() {
      return yield view.make('binding')
    }).then(function (compiledView) {
      expect(compiledView.trim()).to.equal('bar')
      done()
    }).catch(done)

  })

  it('should be able to make generators right inside views', function (done) {
    class Baz {

      greet () {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve('hello')
          }, 100)

        })
      }

    }

    Ioc.bind('Views/Baz', function () {
      return new Baz()
    })

    co(function *() {
      return yield view.make('async')
    }).then(function (compiledView) {
      expect(compiledView.trim()).to.equal('hello')
      done()
    }).catch(done)

  })

})
