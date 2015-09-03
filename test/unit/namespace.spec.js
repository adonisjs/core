'use strict'

const Namespace = require('../../src/Namespace/index')
const Ioc = require('fold').Ioc
const chai = require('chai')
const expect = chai.expect
const path = require('path')

let Helpers = {
  appPath: function () {
    return path.join(__dirname, './namespace/app')
  },
  appNameSpace: function () {
    return 'App'
  }
}

describe('Namespace', function () {
  before(function (done) {
    Ioc.clear()
    done()
  })

  it('should not autoload a given directory when autoloading is disabled inside env', function (done) {
    let Env = {
      get: function () {
        return false
      }
    }

    let namespace = new Namespace(Env, Helpers)

    namespace
      .autoload(path.join(__dirname, './namespace/package.json'))
      .then(function (response) {
        let fn = function () {
          return Ioc.use('App/text')
        }
        expect(fn).to.throw(Error)
        done()
      })
      .catch(done)

  })

  it('should autoload a given directory when autoloading is enabled inside env', function (done) {
    let Env = {
      get: function () {
        return true
      }
    }

    let namespace = new Namespace(Env, Helpers)

    namespace
      .autoload(path.join(__dirname, './namespace/package.json'))
      .then(function (response) {
        expect(Ioc.use('App/text')).to.equal('text')
        done()
      })
      .catch(done)

  })

})
