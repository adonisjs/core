'use strict'

const Session = require('../../src/Session')
const SessionManager = require('../../src/Session/SessionManager')
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
const cookie = require('cookie')

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
})