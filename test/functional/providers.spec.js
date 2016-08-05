'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const expect = chai.expect
const fold = require('adonis-fold')
const Ioc = fold.Ioc
const Registrar = fold.Registrar
const path = require('path')
const sinon = require('sinon')
const fs = require('fs')
require('co-mocha')

function randomString (length) {
  var s = []
  while (s.length < length) {
    s.push(String.fromCharCode(Math.floor(Math.random() * 100)))
  }
  return s.join('')
}

describe('Providers', function () {
  beforeEach(function * () {
    const providersDir = path.join(__dirname, '../../providers')
    const providers = fs.readdirSync(providersDir).map((file) => path.join(providersDir, file))
    yield Registrar.register(providers)
    Ioc.use('Adonis/Src/Helpers').loadInFuture(path.join(__dirname, './app'))
  })

  context('Config', function () {
    it('should inject Helpers provider', function () {
      const Config = require('../../src/Config')
      const Helpers = Ioc.use('Adonis/Src/Helpers')
      sinon.spy(Helpers, 'configPath')
      const config = Ioc.use('Adonis/Src/Config')
      expect(config).to.be.an.instanceof(Config)
      expect(Helpers.configPath.calledOnce).to.equal(true)
      Helpers.configPath.restore()
    })
  })

  context('Encryption', function () {
    it('should inject Config provider', function () {
      const Encryption = require('../../src/Encryption')
      const Config = Ioc.use('Adonis/Src/Config')
      sinon
        .stub(Config, 'get')
        .onFirstCall()
        .returns(randomString(32))
        .onSecondCall()
        .returns('aes-256-cbc')

      const encryption = Ioc.use('Adonis/Src/Encryption')
      expect(encryption).to.be.an.instanceof(Encryption)
      expect(Config.get.calledTwice).to.equal(true)
      Config.get.restore()
    })
  })

  context('Env', function () {
    it('should inject Helpers and Event providers', function () {
      const Helpers = Ioc.use('Adonis/Src/Helpers')
      const Event = Ioc.use('Adonis/Src/Event')
      sinon.spy(Helpers, 'basePath')
      sinon.spy(Event, 'fire')
      const Env = require('../../src/Env')
      const env = Ioc.use('Adonis/Src/Env')
      expect(env).to.be.an.instanceof(Env)
      expect(Helpers.basePath.calledOnce).to.equal(true)
      expect(Event.fire.calledOnce).to.equal(true)
      expect(Event.fire.calledWith('env:loaded')).to.equal(true)
      Event.fire.restore()
      Helpers.basePath.restore()
    })
  })

  context('Event', function () {
    it('should inject Config and Helpers providers', function () {
      const Config = Ioc.use('Adonis/Src/Config')
      sinon.spy(Config, 'get')
      const event = Ioc.use('Adonis/Src/Event')
      const Event = require('../../src/Event')
      expect(event).to.be.an.instanceof(Event)
      expect(Config.get.calledOnce).to.equal(true)
      expect(Config.get.calledWith('event')).to.equal(true)
      Config.get.restore()
    })
  })

  context('Response', function () {
    it('should return Request class to be initiated at each request', function () {
      const Response = Ioc.use('Adonis/Src/Response')
      expect(Response.name).to.equal('Response')
    })
  })
})
