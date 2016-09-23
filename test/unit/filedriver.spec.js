'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const fs = require('co-fs-extra')
const path = require('path')
const FileDriver = require('../../src/Session/Drivers').file

const Helpers = {
  storagePath: function () {
    return path.join(__dirname, '/storage/sessions')
  }
}

const Config = {
  get: function () {
    return 'sessions'
  }
}

require('co-mocha')

describe('Session File Driver', function () {
  this.timeout(5000)

  this.beforeEach(function * () {
    yield fs.remove(path.join(__dirname, '/storage/sessions'))
  })

  it('should save session values using create method', function * () {
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId, {greeting: 'bye world'})
    const contents = yield fs.readFile(path.join(__dirname, '/storage/sessions/' + sessionId), 'utf-8')
    expect(JSON.parse(contents)).deep.equal({greeting: 'bye world'})
  })

  it('should make use of sessions directory when no directory is specified under config', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId, {greeting: 'bye world'})
    const contents = yield fs.readFile(path.join(__dirname, '/storage/sessions/' + sessionId), 'utf-8')
    expect(JSON.parse(contents)).deep.equal({greeting: 'bye world'})
  })

  it('should read session value from a given file', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '102102201'
    yield fileDriver.write(sessionId, JSON.stringify({name: 'virk'}))
    const contents = yield fileDriver.read(sessionId)
    expect(JSON.parse(contents)).deep.equal({name: 'virk'})
  })

  it('should return empty object when unable to read file', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '10010'
    yield fileDriver.write(sessionId, JSON.stringify({name: 'virk'}))
    const contents = yield fileDriver.read('102102202')
    expect(contents).deep.equal({})
  })

  it('should be able to destroy a session file', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = '10010'
    yield fileDriver.write(sessionId, JSON.stringify({name: 'virk'}))
    yield fileDriver.destroy(sessionId)
    const contents = yield fileDriver.read(sessionId)
    expect(contents).deep.equal({})
  })

  it('should return silently when session file does not exists', function * () {
    Config.get = function () {
      return null
    }
    const fileDriver = new FileDriver(Helpers, Config)
    const sessionId = 'abc'
    yield fileDriver.destroy(sessionId)
    const contents = yield fileDriver.read(sessionId)
    expect(contents).deep.equal({})
  })
})
