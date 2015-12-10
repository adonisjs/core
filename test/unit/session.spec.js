'use strict'

const Session = require('../../src/Session')
const SessionManager = require('../../src/Session/SessionManager')
const SessionManagerHelpers = require('../../src/Session/SessionManager/helpers')
const View = require('../../src/View/index')
const Response = require('../../src/Response')
let Env = require('../../src/Env/index')
const CookieDriver = require('../../src/Session/Drivers').cookie
const http = require('http')
const supertest = require("supertest")
const co = require('co')
const chai = require('chai')
const fs = require('fs')
const expect = chai.expect
const path = require('path')
const _ = require('lodash')
const cookie = require('cookie')
const coFs = require('co-fs-extra')

const Helpers = {
  viewsPath: function(){
    return path.join(__dirname,'./views')
  },
  basePath: function(){
    return path.join(__dirname,'./')
  },
  storagePath: function() {
    return path.join(__dirname,'./storage')
  }
}

const Config = {
	get: function () {
		return 'cookie'
	}
}

const fileDriverConfig = {
  get: function() {
    return 'file'
  }
}

Env = new Env(Helpers)

describe('Sessions', function () {

  before(function(done) {

    co(function * () {
      return yield coFs.emptyDir(Helpers.storagePath())
    }).then(done).catch(done)

  })

	context('Session Class', function () {

		it('should return session manager instance with driver configured', function () {

			const session = new Session(Helpers,Config)
			expect(new session instanceof SessionManager).to.equal(true)
			expect(session.driver).to.equal('cookie')

		})

	})

	context('Session Manager', function () {

		it('should setup session as cookie value when using put method', function (done) {

			delete process.env.APP_KEY

			let view = new View(Helpers,Env)
    	let MakeResponse = new Response(view)
    	const Manager = new Session(Helpers,Config)

			var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
	    	const session = new Manager(req,res)

        co (function * () {
        	return yield session.put('foo','bar')
        }).then(function(){
          response.send(' ').end()
        }).catch(done)
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
          	done(err)
          }
          else{
          	const cookies = cookie.parse(res.headers['set-cookie'][0])
          	expect(cookies).to.have.property('adonis-session')
          	expect(JSON.parse(cookies['adonis-session'])[0].d.key).to.equal('foo')
          	expect(JSON.parse(cookies['adonis-session'])[0].d.value).to.equal('bar')
	          done();
	        }
        });

		})


    it('should throw an error when key/value pair or object is not passed on put method', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put('foo')
        }).then(function(){
          response.send(' ').end()
        }).catch(function (error) {
          response.send(error.message).end()
        })
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            expect(res.text).to.match(/key\/value/)
            done();
          }
        });

    })

    it('should throw an error when key/value pair or object is not passed on put method', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put('foo')
        }).then(function(){
          response.send(' ').end()
        }).catch(function (error) {
          response.send(error.message).end()
        })
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            expect(res.text).to.match(/key\/value/)
            done();
          }
        });

    })


    it('should setup multiple sessions as cookie value when using put method', function (done) {
      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put({'foo':'bar','baz':'baz'})
        }).then(function(){
          response.send(' ').end()
        }).catch(done)
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            expect(cookies).to.have.property('adonis-session')
            expect(JSON.parse(cookies['adonis-session'])[0].d.key).to.equal('foo')
            expect(JSON.parse(cookies['adonis-session'])[0].d.value).to.equal('bar')

            expect(JSON.parse(cookies['adonis-session'])[1].d.key).to.equal('baz')
            expect(JSON.parse(cookies['adonis-session'])[1].d.value).to.equal('baz')

            done();
          }
        });
    })

    it('should be able to define session cookie options', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put({'foo':'bar','baz':'baz'}, {path:'/foo'})
        }).then(function(){
          response.send(' ').end()
        }).catch(done)
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            expect(cookies).to.have.property('Path')
            expect(cookies['Path']).to.equal('/foo')
            done();
          }
        });
    })

    it('should be able to define session cookie options when using key/value pairs', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put('name','virk',{path:'/foo', domain: 'http://google.com'})
        }).then(function(){
          response.send(' ').end()
        }).catch(done)
      });

      supertest(server)
        .post("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            expect(cookies).to.have.property('Path')
            expect(cookies).to.have.property('Domain')
            expect(cookies).to.have.property('adonis-session')
            expect(JSON.parse(cookies['adonis-session'])[0].d.value).to.equal('virk')
            expect(JSON.parse(cookies['adonis-session'])[0].d.key).to.equal('name')
            expect(cookies['Path']).to.equal('/foo')
            expect(cookies['Domain']).to.equal('http://google.com')
            done();
          }
        });
    })

    it('should fetch session value defined on request', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.get('foo')
        }).then(function(foo){
          response.send(foo).end()
        }).catch(done)
      });

      supertest(server)
        .get("/")
        .set('Cookie', ['adonis-session=[{"d":{"key":"foo","value":"bar"},"t":"string"},{"d":{"key":"baz","value":"baz"},"t":"string"}]'])
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            expect(res.text).to.equal('bar')
            done();
          }
        });
    })

    it('should replace old values with new when same key is passed', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put('foo','foobar')
        }).then(function(foo){
          response.send(' ').end()
        }).catch(done)
      });

      supertest(server)
        .get("/")
        .set('Cookie', ['adonis-session=[{"d":{"key":"foo","value":"bar"},"t":"string"},{"d":{"key":"baz","value":"baz"},"t":"string"}]'])
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            expect(cookies).to.have.property('adonis-session')
            _.each(JSON.parse(cookies['adonis-session']), function (cookie){
              if(cookie.d.key === 'foo'){
                expect(cookie.d.value).not.to.equal('bar')
              }
            })
            done();
          }
        });
    })


    it('should return null when session do not exists', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)
      const Manager = new Session(Helpers,Config)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.get('foo')
        }).then(function(foo){
          response.send(foo).end()
        }).catch(done)
      });

      supertest(server)
        .get("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            expect(res.text).to.equal('null')
            done();
          }
        });
    })

    it('should set session cookie when using file driver', function (done) {

      delete process.env.APP_KEY

      let view = new View(Helpers,Env)
      let MakeResponse = new Response(view)

      const Manager = new Session(Helpers,fileDriverConfig)

      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        const session = new Manager(req,res)

        co (function * () {
          return yield session.put('foo','bar')
        }).then(function(foo){
          response.send(foo).end()
        }).catch(done)
      });

      supertest(server)
        .get("/")
        .end(function(err, res) {
          if (err){
            done(err)
          }
          else{
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            expect(cookies).to.have.property('adonis-session')
            fs.exists(path.join(Helpers.storagePath(),cookies['adonis-session']), function (there) {
              expect(there).to.equal(true)
              done();
            })
          }
      });
    })

    context('Reading cookies' , function () {

      delete process.env.APP_KEY
      let sessionId = null

      beforeEach(function (done) {

        let view = new View(Helpers,Env)
        let MakeResponse = new Response(view)
        const Manager = new Session(Helpers,fileDriverConfig)

        var server = http.createServer(function(req, res) {

          let response = new MakeResponse(req, res)
          const session = new Manager(req,res)

          co (function * () {

            return yield session.put('foo','bar')

          }).then(function(foo){

            response.send(foo).end()

          }).catch(done)
        });

        supertest(server)
          .get("/")
          .end(function(err, res) {
            if (err){
              done(err)
            }
            const cookies = cookie.parse(res.headers['set-cookie'][0])
            sessionId = cookies['adonis-session']
            done()
          });

      })

      it('should read cookies using file session value defined on request', function (done) {

        let view = new View(Helpers,Env)
        let MakeResponse = new Response(view)
        const Manager = new Session(Helpers,fileDriverConfig)

        var server = http.createServer(function(req, res) {
          let response = new MakeResponse(req, res)
          const session = new Manager(req,res)

          co (function * () {

            return yield session.get('foo')

          }).then(function(foo){

            response.send(foo).end()

          }).catch(done)
        });

        supertest(server)
          .get("/")
          .set('Cookie', ['adonis-session=' + sessionId])
          .end(function(err, res) {
            if (err){
              done(err)
            }
            else{
              expect(res.text).to.equal('bar')
              done();
            }
          });

      })
    })
  })

  context('Helpers', function () {

    it('should convert an object to json string', function () {

      const user = {name:'foo',age:22}
      const toString = SessionManagerHelpers.typeToString(user)

      expect(JSON.stringify(user)).to.equal(toString)

    });

    it('should convert a number to string', function () {

      const age = 22
      const toString = SessionManagerHelpers.typeToString(age)

      expect(age.toString()).to.equal(toString)

    });

    it('should convert a boolean to string', function () {

      const isUser = true
      const toString = SessionManagerHelpers.typeToString(isUser)

      expect('true').to.equal(toString)

    });


    it('should not convert null values', function () {

      const user = null
      const toString = SessionManagerHelpers.typeToString(user)

      expect(null).to.equal(toString)

    });

    it('should not convert undefined values', function () {

      const user = undefined
      const toString = SessionManagerHelpers.typeToString(user)

      expect(undefined).to.equal(toString)

    });

    it('should convert an object to it\'s original type ', function () {

      const user = {d:JSON.stringify({name:'foo',age:22}),t:'object'}
      const toType = SessionManagerHelpers.stringToType(user)

      expect(user.d).deep.equal(toType.d)

    });

    it('should convert a number to it\'s original type ', function () {

      const user = {d:'22',t:'number'}
      const toType = SessionManagerHelpers.stringToType(user)

      expect(22).deep.equal(toType.d)

    });

    it('should convert a boolean with true/false to it\'s original type ', function () {

      const user = {d:'false',t:'boolean'}
      const toType = SessionManagerHelpers.stringToType(user)

      expect(false).to.equal(toType.d)

    });


    it('should convert a boolean with 1/0 to it\'s original type ', function () {

      const user = {d:'1',t:'boolean'}
      const toType = SessionManagerHelpers.stringToType(user)

      expect(true).to.equal(toType.d)

    });

    it('should convert date object to date string', function () {

      const date = new Date()

      const time = {d:JSON.stringify(date),t:'object'}
      const toType = SessionManagerHelpers.stringToType(time)
      expect(JSON.parse(JSON.stringify(date))).to.equal(toType.d)

    });

  })
})
