'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const http = require('http')
const supertest = require('supertest')
const co = require('co')
const Ioc = require('adonis-fold').Ioc
const expect = chai.expect
const _ = require('lodash')
const fs = require('co-fs-extra')
const path = require('path')
const Session = require('../../src/Session')
const Drivers = require('../../src/Session/Drivers')
const CookieDriver = Drivers.cookie
const FileDriver = Drivers.file
const RedisDriver = Drivers.redis
const RedisFactory = require('adonis-redis/src/RedisFactory')
const Store = require('../../src/Session/Store')
const SessionManager = require('../../src/Session/SessionManager')
const querystring = require('querystring')
require('co-mocha')

const parseCookies = function (cookies) {
  return _.reduce(cookies, (map, cookie) => {
    const tokens = cookie.split('=')
    const value = querystring.unescape(_.tail(tokens).join('='))
    map[tokens[0]] = value.startsWith('j:') ? JSON.parse(removeCookieAttribures(value.replace('j:', ''))) : value
    return map
  }, {})
}

const removeCookieAttribures = function (cookie) {
  return cookie.replace(/;.*/, '')
}

const makeConfigObject = function (appKey, sessionObject) {
  sessionObject = sessionObject || {}
  const session = _.merge({
    driver: 'cookie',
    cookie: 'adonis-session',
    domain: 'localhost',
    path: '/',
    clearWithBrowser: true,
    age: 10,
    secure: false,
    redis: {
      host: '127.0.0.1',
      port: '6379',
      keyPrefix: 'session:'
    }
  }, sessionObject)
  return {
    app: { appKey: appKey || null },
    session
  }
}

class Config {
  constructor (appKey, sessionObject) {
    this.config = makeConfigObject(appKey, sessionObject)
  }
  get (key) {
    return _.get(this.config, key)
  }
}

describe('Session', function () {
  beforeEach(function () {
    Session.driver = {}
    Session.config = {}
  })

  context('Session Builder', function () {
    it('should throw an error when unable to locate driver', function * () {
      const fn = () => new SessionManager({get: function () { return 'mongo' }})
      expect(fn).to.throw('RuntimeException: E_INVALID_SESSION_DRIVER: Unable to locate mongo session driver')
    })

    it('should extend session drivers using extend method', function * () {
      class Redis {
      }
      SessionManager.extend('my-redis', new Redis())
      const config = new Config(null, {driver: 'my-redis'})
      const session = new SessionManager(config)
      expect(session.driver instanceof Redis).to.equal(true)
    })

    it('should make an instance of pre existing drivers using make method', function * () {
      let Config = {}
      Config.get = function () {
        return 'file'
      }
      let Helpers = {}
      Helpers.storagePath = function () {
        return ''
      }
      Ioc.bind('Adonis/Src/Config', function () {
        return Config
      })
      Ioc.bind('Adonis/Src/Helpers', function () {
        return Helpers
      })
      const session = new SessionManager(Config)
      expect(session.driver.sessionPath).to.equal('')
    })

    it('should set the driver to the value returned by fresh method', function * () {
      class Redis {
        fresh () {
          return 'foo'
        }
      }
      SessionManager.extend('my-redis', new Redis())
      const Session = new SessionManager(new Config(null, {driver: 'my-redis'}))
      expect(new Session().driver).to.equal('foo')
    })
  })

  context('Session class @session', function () {
    it('should throw an exception when values passed to put method are not valid', function * () {
      Session.config = new Config()
      const session = new Session({once: function () {}})
      try {
        yield session.put('key')
      } catch (e) {
        expect(e.message).to.equal('E_INVALID_PARAMETER: Session.put expects a key/value pair or an object of keys and values')
      }
    })

    it('should not call driver read method multiple times if read operations are more than one', function * () {
      const config = new Config()
      let readCounts = 0
      class FakeDriver {
        * read () {
          readCounts++
        }
      }
      Session.driver = new FakeDriver(config)
      Session.config = config
      const session = new Session({headers: {}, once: function () {}}, {})
      yield session.all()
      yield session.get('foo')
      expect(readCounts).to.equal(1)
    })

    it('should return a clone of session values to keep the actual session safe from mutability', function * () {
      const config = new Config()
      class FakeDriver {
        * read () {
          return {name: {d: 'virk', t: 'String'}}
        }
      }
      Session.driver = new FakeDriver(config)
      Session.config = config
      const session = new Session({headers: {}, once: function () {}}, {})
      const values = yield session.all()
      expect(values).deep.equal({name: 'virk'})
      values.name = 'foo'
      const reFetchSession = yield session.all()
      expect(reFetchSession).deep.equal({name: 'virk'})
    })

    it('should property of session from the internal payload, instead of the cloned copy', function * () {
      const config = new Config()
      class FakeDriver {
        * read () {
          return {name: {d: 'virk', t: 'String'}}
        }
      }
      Session.driver = new FakeDriver(config)
      Session.config = config
      const session = new Session({headers: {}, once: function () {}}, {})
      const values = yield session.all()
      expect(values).deep.equal({name: 'virk'})
      values.name = 'foo'
      const name = yield session.get('name')
      expect(name).deep.equal('virk')
    })

    it('should deep property of session using get method', function * () {
      const config = new Config()
      class FakeDriver {
        * read () {
          return {profile: {d: {name: 'virk'}, t: 'Object'}}
        }
      }
      Session.driver = new FakeDriver(config)
      Session.config = config
      const session = new Session({headers: {}, once: function () {}}, {})
      const name = yield session.get('profile.name')
      expect(name).deep.equal('virk')
    })

    it('should be able to pull deeply property of session using get method', function * () {
      const config = new Config()
      class FakeDriver {
        * read () {
          return {profile: {d: {name: 'virk', age: 22}, t: 'Object'}}
        }

        * write () {
        }
      }
      Session.driver = new FakeDriver(config)
      Session.config = config
      const session = new Session({headers: {}, once: function () {}}, {getHeader: function () {}, setHeader: function () {}})
      const name = yield session.pull('profile.name')
      expect(name).deep.equal('virk')
      const all = yield session.all()
      expect(all).to.deep.equal({profile: {age: 22, name: null}})
    })
  })

  context('Session Store', function () {
    it('should convert object to string representation', function () {
      const value = {name: 'virk'}
      const key = 'profile'
      const body = Store.guardPair(key, value)
      expect(body).to.deep.equal({d: JSON.stringify(value), t: 'Object'})
    })

    it('should convert date to string representation', function () {
      const value = new Date()
      const key = 'time'
      const body = Store.guardPair(key, value)
      expect(body).to.deep.equal({d: String(value), t: 'Date'})
    })

    it('should convert number to string representation', function () {
      const value = 22
      const key = 'age'
      const body = Store.guardPair(key, value)
      expect(body).to.deep.equal({d: String(value), t: 'Number'})
    })

    it('should convert array to string representation', function () {
      const value = [22, 42]
      const key = 'marks'
      const body = Store.guardPair(key, value)
      expect(body).to.deep.equal({d: JSON.stringify(value), t: 'Array'})
    })

    it('should convert boolean to string representation', function () {
      const value = true
      const key = 'admin'
      const body = Store.guardPair(key, value)
      expect(body).to.deep.equal({d: String(value), t: 'Boolean'})
    })

    it('should convert return null when value is a function', function () {
      const value = function () {}
      const key = 'admin'
      const body = Store.guardPair(key, value)
      expect(body).to.equal(null)
    })

    it('should convert return null when value is a regex', function () {
      const value = /12/
      const key = 'admin'
      const body = Store.guardPair(key, value)
      expect(body).to.equal(null)
    })

    it('should convert return null when value is an error', function () {
      const value = new Error()
      const key = 'admin'
      const body = Store.guardPair(key, value)
      expect(body).to.equal(null)
    })

    it("should convert body with object to it's original value", function () {
      const value = {name: 'virk'}
      const body = {
        d: JSON.stringify(value),
        t: 'Object'
      }
      const convertedValue = Store.unGuardPair(body)
      expect(convertedValue).deep.equal(value)
    })

    it("should convert body with number to it's original value", function () {
      const value = 22
      const body = {
        d: String(value),
        t: 'Number'
      }
      const convertedValue = Store.unGuardPair(body)
      expect(convertedValue).to.equal(value)
    })

    it("should convert body with Array to it's original value", function () {
      Session.config = new Config()
      const value = [22, 42]
      const body = {
        d: JSON.stringify(value),
        t: 'Array'
      }
      const convertedValue = Store.unGuardPair(body)
      expect(convertedValue).deep.equal(value)
    })

    it("should convert body with negative boolean to it's original value", function () {
      const value = false
      const body = {
        d: String(value),
        t: 'Boolean'
      }
      const convertedValue = Store.unGuardPair(body)
      expect(convertedValue).to.equal(value)
    })

    it("should convert body with positive boolean to it's original value", function () {
      const value = true
      const body = {
        d: String(value),
        t: 'Boolean'
      }
      const convertedValue = Store.unGuardPair(body)
      expect(convertedValue).to.equal(true)
    })
  })

  context('Cookie Driver @cookie', function () {
    it('should set session on cookies when active driver is cookie', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      expect(cookies).to.have.property('adonis-session-value')
      expect(cookies['adonis-session-value'].sessionId).to.equal(removeCookieAttribures(cookies['adonis-session']))
      expect(cookies['adonis-session-value'].data).deep.equal({name: Store.guardPair('name', 'virk')})
    })

    it('should set multiple session values on cookies using object', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put({name: 'virk', age: 22})
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      expect(cookies).to.have.property('adonis-session-value')
      expect(cookies['adonis-session-value'].sessionId).to.equal(removeCookieAttribures(cookies['adonis-session']))
      const data = {}
      data.name = Store.guardPair('name', 'virk')
      data.age = Store.guardPair('age', 22)
      expect(cookies['adonis-session-value'].data).deep.equal(data)
    })

    it('should set json as value for a given key', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('profile', {name: 'virk', age: 22})
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      expect(cookies).to.have.property('adonis-session-value')
      expect(cookies['adonis-session-value'].sessionId).to.equal(removeCookieAttribures(cookies['adonis-session']))
      const data = {}
      data.profile = Store.guardPair('profile', {name: 'virk', age: 22})
      expect(cookies['adonis-session-value'].data).deep.equal(data)
    })

    it('should not set key/value pair on session when value is not of a valid type', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put({ name: 'virk', age: function () {} })
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      expect(cookies).to.have.property('adonis-session-value')
      expect(cookies['adonis-session-value'].sessionId).to.equal(removeCookieAttribures(cookies['adonis-session']))
      let data = {}
      data.name = Store.guardPair('name', 'virk')
      expect(cookies['adonis-session-value'].data).deep.equal(data)
    })

    it('should make use of existing session id if defined', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=11']).expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('11; Domain=localhost; Path=/')
    })

    it('should be able to remove existing session value', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'virk')
          yield session.forget('name')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: 11,
        data: {}
      }
      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=11']).expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      expect(cookies['adonis-session']).to.equal('11; Domain=localhost; Path=/')
      expect(cookies).to.have.property('adonis-session-value')
      expect(cookies['adonis-session-value'].sessionId).to.equal(removeCookieAttribures(cookies['adonis-session']))
      expect(cookies['adonis-session-value'].data).deep.equal({})
    })

    it('should return empty object when current sessionId does not equals the values session id', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.all()
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: 11,
        data: {}
      }
      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session-value=j:' + JSON.stringify(body)]).expect(200)
      expect(res.body.name).deep.equal({})
    })

    it('should return all session values sent along the request', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.all()
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '11',
        data: {}
      }
      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=11; adonis-session-value=j:' + JSON.stringify(body) + ';']).expect(200)
      expect(res.body.name).deep.equal({name: 'virk'})
    })

    it('should be able to read existing session values from request', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('name')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '20',
        data: {}
      }
      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=20; adonis-session-value=j:' + JSON.stringify(body)]).expect(200)
      expect(res.body.name).to.equal('virk')
    })

    it('should return default value when existing session value does not exists', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('name', 'foo')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      expect(res.body.name).to.equal('foo')
    })

    it('should return session value and delete it from session using pull method', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.pull('name')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '40',
        data: {}
      }
      body.data.name = Store.guardPair('name', 'virk')
      body.data.age = Store.guardPair('age', 22)
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=40; adonis-session-value=j:' + JSON.stringify(body)]).expect(200)
      expect(res.body.name).to.equal('virk')
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('40; Domain=localhost; Path=/')
      expect(cookies['adonis-session-value'].data).deep.equal({age: body.data.age})
    })

    it('should return empty object when pull is called on the last session value', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.pull('name')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '40',
        data: {}
      }

      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=40; adonis-session-value=j:' + JSON.stringify(body)]).expect(200)
      expect(res.body.name).to.equal('virk')
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('40; Domain=localhost; Path=/')
      expect(cookies['adonis-session-value'].data).deep.equal({})
    })

    it('should clear the session id from the cookie when flush has been called', function * () {
      const config = new Config()
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('age', 22)
          return yield session.flush()
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '40',
        data: {}
      }

      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=40; adonis-session-value=j:' + JSON.stringify(body)]).expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
      expect(cookies['adonis-session-value']).to.equal('; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
    })

    it('should set expiry on cookie when session clearWithBrowser is set to false', function * () {
      const config = new Config(null, {clearWithBrowser: false})
      Session.driver = new CookieDriver(config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('age', 22)
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      let body = {
        sessionId: '40',
        data: {}
      }

      body.data.name = Store.guardPair('name', 'virk')
      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.match(/Expires=\w{3},\s*\d{1,}\s*\w{3}\s*\d{4}/)
    })
  })

  context('File Driver @file', function () {
    before(function () {
      this.Helpers = {
        storagePath: function () {
          return path.join(__dirname, './storage/sessions')
        }
      }
    })

    beforeEach(function * () {
      yield fs.emptyDir(this.Helpers.storagePath())
    })

    it('should set session using file driver', function * () {
      const config = new Config()
      Session.driver = new FileDriver(this.Helpers, config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      const sessionId = removeCookieAttribures(cookies['adonis-session'])
      const sessionValues = yield fs.readJson(path.join(__dirname, './storage/sessions', sessionId))
      expect(sessionValues).deep.equal({name: Store.guardPair('name', 'virk')})
    })

    it('should update session values when session already exists', function * () {
      const config = new Config()
      Session.driver = new FileDriver(this.Helpers, config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.put('name', 'updated name')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '122002'
      yield fs.writeJson(path.join(this.Helpers.storagePath(), sessionId), {name: Store.guardPair('name', 'foo')})
      const res = yield supertest(server).get('/').set('Cookie', 'adonis-session=' + sessionId).expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('122002; Domain=localhost; Path=/')
      const sessionValues = yield fs.readJson(path.join(this.Helpers.storagePath(), sessionId))
      expect(sessionValues).deep.equal({name: Store.guardPair('name', 'updated name')})
    })

    it('should read value for a given key from session using file driver', function * () {
      const config = new Config()
      Session.driver = new FileDriver(this.Helpers, config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('name')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '122002'
      yield fs.writeJson(path.join(this.Helpers.storagePath(), sessionId), {name: Store.guardPair('name', 'virk')})
      const res = yield supertest(server).get('/').set('Cookie', 'adonis-session=' + sessionId).expect(200)
      expect(res.body.name).to.equal('virk')
    })

    it('should be able to put values to session store multiple times in a single request', function * () {
      const config = new Config()
      Session.driver = new FileDriver(this.Helpers, config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'foo')
          yield session.flush()
          yield session.put('age', 22)
        }).then(function () {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      const sessionId = removeCookieAttribures(cookies['adonis-session'])
      const sessionValues = yield fs.readJson(path.join(this.Helpers.storagePath(), sessionId))
      expect(sessionValues).deep.equal({age: Store.guardPair('age', 22)})
    })

    it('should be remove session file on flush', function * () {
      const config = new Config()
      Session.driver = new FileDriver(this.Helpers, config)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'foo')
          yield session.flush()
        }).then(function () {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '39000'
      yield supertest(server).get('/').set('Cookie', ['adonis-session=' + sessionId]).expect(200)
      const sessionFileExists = yield fs.exists(path.join(this.Helpers.storagePath(), sessionId))
      expect(sessionFileExists).to.equal(false)
    })
  })

  context('Redis Driver @redis', function () {
    before(function () {
      this.Helpers = {}
      this.redis = new RedisFactory(new Config().get('session.redis'), this.Helpers, false)
    })

    afterEach(function * () {
      const all = yield this.redis.keys('session:*')
      const pipeline = this.redis.multi()
      all.forEach((key) => {
        pipeline.del(key)
      })
      yield pipeline.exec()
    })

    it('should set session using redis driver', function * () {
      const config = new Config()
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          console.log(err)
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies).to.have.property('adonis-session')
      const sessionId = removeCookieAttribures(cookies['adonis-session'])
      const sessionValues = yield this.redis.get(sessionId)
      expect(JSON.parse(sessionValues)).deep.equal({name: Store.guardPair('name', 'virk')})
    })

    it('should update session values when session already exists', function * () {
      const config = new Config()
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.put('name', 'updated name')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '122002'
      yield this.redis.set(sessionId, JSON.stringify({name: Store.guardPair('name', 'foo')}))
      const res = yield supertest(server).get('/').set('Cookie', 'adonis-session=' + sessionId).expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      expect(cookies['adonis-session']).to.equal('122002; Domain=localhost; Path=/')
      const sessionValues = yield this.redis.get(sessionId)
      expect(JSON.parse(sessionValues)).deep.equal({name: Store.guardPair('name', 'updated name')})
    })

    it('should read value for a given key from session using redis driver', function * () {
      const config = new Config()
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('name')
        }).then(function (name) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '122002'
      yield this.redis.set(sessionId, JSON.stringify({name: Store.guardPair('name', 'foo')}))
      const res = yield supertest(server).get('/').set('Cookie', 'adonis-session=' + sessionId).expect(200)
      expect(res.body.name).to.equal('foo')
    })

    it('should be able to put values to session store multiple times in a single request', function * () {
      const config = new Config()
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'foo')
          yield session.flush()
          yield session.put('age', 22)
        }).then(function () {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get('/').expect(200)
      const cookies = parseCookies(res.headers['set-cookie'])
      const sessionId = removeCookieAttribures(cookies['adonis-session'])
      const sessionValues = yield this.redis.get(sessionId)
      expect(JSON.parse(sessionValues)).deep.equal({age: Store.guardPair('age', 22)})
    })

    it('should remove session key from redis on flush', function * () {
      const config = new Config()
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'foo')
          yield session.flush()
        }).then(function () {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '102010'
      yield supertest(server).get('/').set('Cookie', ['adonis-session=' + sessionId]).expect(200)
      const sessionValues = yield this.redis.get(sessionId)
      expect(sessionValues).to.equal(null)
    })

    it('should set proper ttl on the session id', function * () {
      const config = new Config(null, {age: 120})
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          yield session.put('name', 'foo')
        }).then(function () {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '102010'
      yield supertest(server).get('/').set('Cookie', ['adonis-session=' + sessionId]).expect(200)
      const sessionTTL = yield this.redis.ttl(sessionId)
      expect(sessionTTL).to.equal(120)
    })

    it('should return null when value does not exists in the session store', function * () {
      const config = new Config(null, {age: 120})
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('age')
        }).then(function (age) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({age}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = '102010'
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=' + sessionId]).expect(200)
      expect(res.body.age).to.equal(null)
    })

    it('should return null when the sessionId does not exists in the session store', function * () {
      const config = new Config(null, {age: 120})
      Session.driver = new RedisDriver(this.Helpers, config, RedisFactory)
      Session.config = config

      const server = http.createServer(function (req, res) {
        const session = new Session(req, res)
        co(function * () {
          return yield session.get('age')
        }).then(function (age) {
          res.writeHead(200, {'content-type': 'application/json'})
          res.end(JSON.stringify({age}))
        }).catch(function (err) {
          res.writeHead(500, {'content-type': 'application/json'})
          res.end(JSON.stringify(err))
        })
      })

      const sessionId = new Date().getTime()
      const res = yield supertest(server).get('/').set('Cookie', ['adonis-session=' + sessionId]).expect(200)
      expect(res.body.age).to.equal(null)
    })
  })
})
