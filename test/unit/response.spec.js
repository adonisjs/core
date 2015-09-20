'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/


const Response = require('../../src/Response/index')
const Request = require('../../src/Request/index')
const Route = require('../../src/Route')
let Env = require('../../src/Env/index')
const View = require('../../src/View/index')
const chai = require('chai')
const path = require('path')
const co = require('co')
const http = require('http')
const supertest = require("supertest")
const expect = chai.expect

let Helpers = {
  viewsPath: function(){
    return path.join(__dirname,'./views')
  },
  basePath: function(){
    return path.join(__dirname,'./')
  }
}

Env = new Env(Helpers)

describe('Response', function () {
  it('should extend node-res prototype', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view)

    let response = new MakeResponse({}, {})
    let proto = response.__proto__

    expect(proto).to.be.an('object')
    expect(proto).to.have.property('header')
    expect(proto).to.have.property('end')
    expect(proto).to.have.property('send')
    expect(proto).to.have.property('view')
    done()
  })

  it("should compile a view using View class and return compiled template", function(done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view)

      const name = 'virk'
      var server = http.createServer(function(req, res) {
        let response = new MakeResponse(req, res)
        co (function * () {
          return yield response.view('index.html',{name})
        }).then(function(view){
          response.send(view).end()
        }).catch(function(error){
          response.send(error.message).end()
        })
      });

      supertest(server)
        .post("/")
        .set("token", 123)
        .end(function(err, res) {
          if (err) throw (err);
          expect(res.text.trim()).to.equal(name)
          done();
        });
  });

  it('should redirect to a given route', function (done) {
    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    Route.get('/profile/:id', 'ProfileController')

    var server = http.createServer(function(req, res) {
      let response = new MakeResponse(req, res)
      response.route('/profile/:id',{id:1})
      response.end()
    });


    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers.location).to.equal('/profile/1')
        done();
      });

  })


  it('should redirect to named route', function (done) {
    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    Route.get('/about/:id', 'ProfileController').as('me')

    var server = http.createServer(function(req, res) {
      let response = new MakeResponse(req, res)
      response.route('me',{id:1})
      response.end()
    });


    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers.location).to.equal('/about/1')
        done();
      });
  })


  it('should attach cookies to request response', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo', 'bar')
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).deep.equal(['foo=bar'])
        done();
      });

  })

  it('should attach multiple cookies when using cookie method multiple times', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar')
      response.cookie('baz','baz')
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).deep.equal(['foo=bar','baz=baz'])
        done();
      });

  })


  it('should set domain for cookie', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar',{domain: 'http://adonisjs.com'})
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).deep.equal(['foo=bar; Domain=http://adonisjs.com'])
        done();
      });

  })


  it('should set options for multiple cookies', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar',{path: '/foo'})
      response.cookie('baz','baz',{path: '/foo'})
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).deep.equal(['foo=bar; Path=/foo','baz=baz; Path=/foo'])
        done();
      });

  })


  it('should overide existing cookie when passed new value', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar')
      response.cookie('foo','baz')
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).deep.equal(['foo=baz'])
        done();
      });

  })


  it('should clear cookie from response', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar')
      response.clearCookie('foo')
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).to.equal(undefined)
        done();
      });

  })


  it('should not throw error when deleting non-existing cookie', function (done) {

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.clearCookie('foo')
      response.send('')
      response.end()
    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).to.equal(undefined)
        done();
      });

  })


  it('should encrypt and sign cookies', function (done) {

    process.env.APP_KEY = '12192102002201921021AABB'

    let view = new View(Helpers,Env)
    let MakeResponse = new Response(view,Route)

    var server = http.createServer(function (req, res) {

      let response = new MakeResponse(req,res);
      response.cookie('foo','bar')
      response.send('')
      response.end()

    })

    supertest(server)
      .get("/")
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.headers['set-cookie']).to.match(/foo=.*/g)
        done();
      });

  })


  it('should decrypt and unsign signed cookies', function (done) {

    process.env.APP_KEY = '12192102002201921021AABB'

    var server = http.createServer(function (req, res) {

      var request = new Request(req)
      const cookie = request.cookie('foo')
      res.end(cookie)
    })

    supertest(server)
      .get("/")
      .set('Cookie', ['foo=BsMYi0teP2BEA%2FJoBjiveg%3D%3D.NU993JsT1wbYT4sdKw6YS6UceaO5tM3wdGqrrZ9O7OI'])
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal('bar')
        done();
      });

  })


  it('should return false when cookies have been tampered', function (done) {

    process.env.APP_KEY = '12192102002201921021AABB'

    var server = http.createServer(function (req, res) {

      var request = new Request(req)
      const cookie = request.cookie('foo')
      res.end(cookie)
    })

    supertest(server)
      .get("/")
      .set('Cookie', ['foo=BsMYi0teP2BEA%2FJoBJiveg%3D%3D.NU993JsT1wbYT4sdKw6YS6UceaO5tM3wdGqrrZ9O7OI'])
      .end(function(err, res) {
        if (err) throw (err);
        expect(res.text).to.equal('')
        done();
      });

  })

})
