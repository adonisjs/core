'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const http = require('http')
const supertest = require('co-supertest')
const co = require('co')
const expect = chai.expect
const SessionManager = require('../../src/Session/SessionManager')
const Session = require('../../src/Session')
const querystring = require("querystring")
require('co-mocha')

let Config = {
  get: function () {
    return 'cookie'
  }
}

describe('Session', function  () {

  context('Session Builder', function () {
    it('should extend session drivers using extend method', function * () {
      class Redis {
      }
      Config.get = function () {
        return 'redis'
      }
      Session.extend('redis', new Redis)
      const session = new Session(Config)
      expect(session.driver instanceof Redis).to.equal(true)
    })

    it('should return list of extended session drivers', function * () {
      expect(Session.drivers()).to.be.an('object')
    })

    it('should throw an error when unable to locate driver', function * () {

      Config.get = function () {
        return 'mongo'
      }
      const fn = function () {
        return new Session(Config)
      }
      expect(fn).to.throw(/Unable to locate mongo session driver/i)
    })

    it('should set driver to cookie when driver under use is cookie', function * () {
      Config.get = function () {
        return 'cookie'
      }
      const session = new Session(Config)
      expect(session.driver).to.equal('cookie')
    })
  })

  context('Session Manager', function () {

    it('should not put values to existing session when key/value pair is not provided', function * (){
      const sessionManager = new SessionManager()
      try{
       yield sessionManager.put('key')
      }catch(e){
        expect(e.message).to.match(/put expects/)
      }
    })

    it('should return session key using getter', function * (){
      const sessionManager = new SessionManager()
      expect(sessionManager.sessionKey).to.equal('adonis-session')
    })

    it('should convert object to string representation', function () {
      const sessionManager = new SessionManager()
      const value = {name:"virk"}
      const key = "profile"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.deep.equal({d:JSON.stringify(value),t:"Object"})
    })

    it('should convert date to string representation', function () {
      const sessionManager = new SessionManager()
      const value = new Date()
      const key = "time"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.deep.equal({d:String(value),t:"Date"})
    })

    it('should convert number to string representation', function () {
      const sessionManager = new SessionManager()
      const value = 22
      const key = "age"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.deep.equal({d:String(value),t:"Number"})
    })

    it('should convert array to string representation', function () {
      const sessionManager = new SessionManager()
      const value = [22,42]
      const key = "marks"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.deep.equal({d:JSON.stringify(value),t:"Array"})
    })

    it('should convert boolean to string representation', function () {
      const sessionManager = new SessionManager()
      const value = true
      const key = "admin"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.deep.equal({d:String(value),t:"Boolean"})
    })

    it('should convert return null when value is a function', function () {
      const sessionManager = new SessionManager()
      const value = function () {}
      const key = "admin"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.equal(null)
    })

    it('should convert return null when value is a regex', function () {
      const sessionManager = new SessionManager()
      const value = /12/
      const key = "admin"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.equal(null)
    })

    it('should convert return null when value is an error', function () {
      const sessionManager = new SessionManager()
      const value = new Error()
      const key = "admin"
      const body = sessionManager._makeBody(key, value)
      expect(body).to.equal(null)
    })

    it('should convert body with object to it\'s original value', function () {
      const sessionManager = new SessionManager()
      const value = {name:"virk"}
      const body = {
        d:JSON.stringify(value),
        t: 'Object'
      }
      const convertedValue = sessionManager._reverseBody(body)
      expect(convertedValue).deep.equal(value)
    })

    it('should convert body with number to it\'s original value', function () {
      const sessionManager = new SessionManager()
      const value = 22
      const body = {
        d: String(value),
        t: 'Number'
      }
      const convertedValue = sessionManager._reverseBody(body)
      expect(convertedValue).to.equal(value)
    })

    it('should convert body with Array to it\'s original value', function () {
      const sessionManager = new SessionManager()
      const value = [22,42]
      const body = {
        d: JSON.stringify(value),
        t: 'Array'
      }
      const convertedValue = sessionManager._reverseBody(body)
      expect(convertedValue).deep.equal(value)
    })

    it('should convert body with negative boolean to it\'s original value', function () {
      const sessionManager = new SessionManager()
      const value = false
      const body = {
        d: String(value),
        t: 'Boolean'
      }
      const convertedValue = sessionManager._reverseBody(body)
      expect(convertedValue).to.equal(value)
    })

    it('should convert body with positive boolean to it\'s original value', function () {
      const sessionManager = new SessionManager()
      const value = true
      const body = {
        d: String(value),
        t: 'Boolean'
      }
      const convertedValue = sessionManager._reverseBody(body)
      expect(convertedValue).to.equal(true)
    })

    it('should set session on cookies when active driver is cookie', function * () {

      SessionManager.driver = 'cookie'
      let sessionManager

      const server = http.createServer(function (req, res) {
        sessionManager = new SessionManager(req, res)
        co(function * () {
          yield sessionManager.put('name','virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      const session = res.headers['set-cookie'][0].split('=')
      let body = {}
      body.name = sessionManager._makeBody('name','virk')
      expect(session[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))

    })

    it('should set multiple session values on cookies using object', function * () {

      SessionManager.driver = 'cookie'
      let sessionManager

      const server = http.createServer(function (req, res) {
        sessionManager = new SessionManager(req, res)
        co(function * () {
          yield sessionManager.put({name:'virk',age:22})
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      const session = res.headers['set-cookie'][0].split('=')
      let body = {}
      body.name = sessionManager._makeBody('name','virk')
      body.age = sessionManager._makeBody('age',22)
      expect(session[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))

    })

    it('should set json as value for a given key', function * () {

      SessionManager.driver = 'cookie'
      let sessionManager

      const server = http.createServer(function (req, res) {
        sessionManager = new SessionManager(req, res)
        co(function * () {
          yield sessionManager.put('profile',{name:'virk',age:22})
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      const session = res.headers['set-cookie'][0].split('=')
      let body = {}
      body.profile = {d: JSON.stringify({name:"virk",age:22}), t: 'Object' }
      expect(session[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))

    })

    it('should not set key/value pair on session when value is not of a valid type', function * () {

      SessionManager.driver = 'cookie'
      let sessionManager

      const server = http.createServer(function (req, res) {
        sessionManager = new SessionManager(req, res)
        co(function * () {
          yield sessionManager.put({name:'virk',age:function () {} })
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      const session = res.headers['set-cookie'][0].split('=')
      let body = {}
      body.name = sessionManager._makeBody('name','virk')
      expect(session[1]).to.equal(querystring.escape('j:'+JSON.stringify(body)))

    })

    it('should remove existing session value', function * () {

      SessionManager.driver = 'cookie'
      const sessionManagerFake = new SessionManager()

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          yield sessionManager.forget('name')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      let body = {}
      body.name = sessionManagerFake._makeBody('name','virk')
      const res = yield supertest(server).get("/").set('Cookie',['adonis-session=j:'+JSON.stringify(body)]).expect(200).end()
      expect(res.headers['set-cookie']).to.equal(undefined)

    })

    it('should return all session values', function * () {

      SessionManager.driver = 'cookie'
      const sessionManagerFake = new SessionManager()

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.all()
        }).then(function (name) {
          res.writeHead(200,{"content-type": "application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          console.log(err)
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      let body = {}
      body.name = sessionManagerFake._makeBody('name','virk')
      const res = yield supertest(server).get("/").set('Cookie',['adonis-session=j:'+JSON.stringify(body)]).expect(200).end()
      expect(res.body.name).deep.equal({name:'virk'})

    })

    it('should get existing session value', function * () {

      SessionManager.driver = 'cookie'
      const sessionManagerFake = new SessionManager()

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.get('name')
        }).then(function (name) {
          res.writeHead(200,{"content-type": "application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          console.log(err)
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      let body = {}
      body.name = sessionManagerFake._makeBody('name','virk')
      const res = yield supertest(server).get("/").set('Cookie',['adonis-session=j:'+JSON.stringify(body)]).expect(200).end()
      expect(res.body.name).to.equal('virk')

    })

    it('should return default value when existing session value does not exists', function * () {

      SessionManager.driver = 'cookie'
      const sessionManagerFake = new SessionManager()

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.get('name','foo')
        }).then(function (name) {
          res.writeHead(200,{"content-type": "application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      let body = {}
      body.name = sessionManagerFake._makeBody('name','virk')
      const res = yield supertest(server).get("/").expect(200).end()
      expect(res.body.name).to.equal('foo')

    })

    it('should return session value and delete it from session using pull method', function * () {

      SessionManager.driver = 'cookie'
      const sessionManagerFake = new SessionManager()

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.pull('name')
        }).then(function (name) {
          res.writeHead(200,{"content-type": "application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      let body = {}
      body.name = sessionManagerFake._makeBody('name','virk')
      body.age = sessionManagerFake._makeBody('age',22)
      const res = yield supertest(server).get("/").set('Cookie',['adonis-session=j:'+JSON.stringify(body)]).expect(200).end()
      expect(res.body.name).to.equal('virk')
      let trustedValue = res.headers['set-cookie'][res.headers['set-cookie'].length - 1]
      trustedValue = trustedValue.split('=')
      trustedValue = JSON.parse(querystring.unescape(trustedValue[1]).replace('j:',''))
      expect(trustedValue.name).to.equal(undefined)

    })

    it('should set session when session driver is not cookie', function * () {

      let sessionId = null
      let sessionValue = {}

      const FileDriver = {
        * read () {
          return {}
        },
        * write (id,value) {
          sessionId = id
          sessionValue = value
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.put('name','virk')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      expect(res.headers['set-cookie'][0]).to.equal('adonis-session='+sessionId)
      expect(sessionValue).to.equal(JSON.stringify({name:{d:'virk',t:'String'}}))

    })

    it('should update session values when session already exists', function * () {

      let sessionId = '123456789'
      let sessionValue = {}

      const FileDriver = {
        * read () {
          return {name:'virk'}
        },
        * write (id,value) {
          sessionValue = value
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.put('name','foo')
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").set('Cookie','adonis-session='+sessionId).expect(200).end()
      expect(res.headers['set-cookie'][0]).to.equal('adonis-session='+sessionId)
      expect(sessionValue).to.equal(JSON.stringify({name:{d:'foo',t:'String'}}))

    })

    it('should add more value to session values when session already exists', function * () {

      let sessionId = '123456789'
      let sessionValue = {}

      const FileDriver = {
        * read () {
          return {name:{d:'virk','t':'String'}}
        },
        * write (id,value) {
          sessionValue = value
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.put('age',22)
        }).then(function () {
          res.writeHead(200)
          res.end()
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").set('Cookie','adonis-session='+sessionId).expect(200).end()
      expect(res.headers['set-cookie'][0]).to.equal('adonis-session='+sessionId)
      expect(sessionValue).to.equal(JSON.stringify({name:{d:'virk',t:'String'},age:{d:'22',t:'Number'}}))

    })

    it('should read value for a given key from session using file driver', function * () {

      let sessionId = '123456789'

      const FileDriver = {
        * read () {
          return {name:{d:'virk','t':'String'}}
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.get('name')
        }).then(function (name) {
          res.writeHead(200,{"content-type":"application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").set('Cookie','adonis-session='+sessionId).expect(200).end()
      expect(res.body.name).to.equal('virk')

    })

    it('should return default value when session id does not exists', function * () {

      const FileDriver = {
        * read () {
          return {name:{d:'virk','t':'String'}}
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.get('name','foo')
        }).then(function (name) {
          res.writeHead(200,{"content-type":"application/json"})
          res.end(JSON.stringify({name}))
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").expect(200).end()
      expect(res.body.name).to.equal('foo')

    })

    it('should return default value when value does not exists in session', function * () {

      let sessionId = '123456789'

      const FileDriver = {
        * read () {
          return {name:{d:'virk','t':'String'}}
        }
      }
      SessionManager.driver = FileDriver

      const server = http.createServer(function (req, res) {
        const sessionManager = new SessionManager(req, res)
        co(function * () {
          return yield sessionManager.get('age',22)
        }).then(function (age) {
          res.writeHead(200,{"content-type":"application/json"})
          res.end(JSON.stringify({age}))
        }).catch(function (err) {
          res.writeHead(500, {"content-type":"application/json"})
          res.end(JSON.stringify(err))
        })
      })

      const res = yield supertest(server).get("/").set('Cookie','adonis-session='+sessionId).expect(200).end()
      expect(res.body.age).to.equal(22)

    })
  })

})
