'use strict'
/* global describe, it, before, beforeEach */

/**
 * @author      - Harminder Virk
 * @package     - adonis-framework
 * @description - Integeration tests to figure out how stuff looks under same roof.
 */

const Dispatcher = require('../../index')
const api = require('hippie')
const path = require('path')
const chai = require('chai')
const expect = chai.expect
const Routes = Dispatcher.Route
const Env = Dispatcher.Env
const Request = Dispatcher.Request
const Logger = Dispatcher.Logger
const Session = Dispatcher.Session
const View = Dispatcher.View
const Response = Dispatcher.Response
const Helpers = Dispatcher.Helpers
const Ioc = require('adonis-fold').Ioc
const Middlewares = Dispatcher.Middlewares
const Namespace = Dispatcher.Namespace
const Static = Dispatcher.Static
let server = null


  let getData = function(data,timeout) {
    return new Promise(function(resolve, reject) {
      if (!timeout) {
        resolve(data);
      }else{
        setTimeout(function(){
          resolve(data);
        },timeout);
      }
    });
  }

  describe("Basic Http Server", function() {

    before(function(done){

      this.timeout(5000)

      Helpers.load(path.join(__dirname,'./package.json'))
      let env = new Env(Helpers)
      let namespace = new Namespace(env,Helpers)

      let view = new View(Helpers,env)
      let response = new Response(view)
      let session = new Session(Helpers,{
        get: function() {
          return 'cookie'
        }
      })
      server = new Dispatcher.Server(Routes,Request,response,Logger,session)
      namespace.autoload()

      done()

    })

  it('should throw 404 when route is not found', function (done) {
    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/404')
      .expectStatus(404)
      .end(function (err, res, body) {
        if (err) done(err)
        else done()
      })
  })

  it('should throw 503 error when route controller syntax is not readable', function (done) {
    Routes.get('/foo', 'FooController')

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/foo')
      .expectStatus(503)
      .end(function (err, res, body) {
        if (err) done(err)
        else done()
      })
  })

    it('should spyn a server on given port and respond to a registered route', function (done) {
      let usersToReturn = [{
        username: 'foo',
        age: 22
      }, {
        username: 'bar',
        age: 25
      }]

      Routes.get('/user', function *(request, response) {
        let users = yield getData(usersToReturn)
        if (users) {
          response.status(200).send(users)
        }
      })

      server.start('0.0.0.0', 4000)

      api()
        .json()
        .base('http://localhost:4000')
        .get('/user')
        .expectStatus(200)
        .expectBody(usersToReturn)
        .end(function (err, res, body) {
          if (err) {
            done(err)
          } else {
            done()
          }
        })
    })

    it("should be able to return any data type from request", function(done) {
      Routes.get("/home", function*(request, response) {
        return "hello world";
      });

      server.start('0.0.0.0', 4000)

      api()
        .base('http://localhost:4000')
        .get('/home')
        .expectStatus(200)
        .expectBody("hello world")
        .end(function(err, res, body) {
          if (err) done(err)
          else done();
        })
    });


    it("should throw 404 when route is not found", function(done) {
      server.start('0.0.0.0', 4000)

      api()
        .base('http://localhost:4000')
        .get('/404')
        .expectStatus(404)
        .end(function(err, res, body) {
          if (err) done(err)
          else done();
        })
    });

    it("should throw 503 error when route controller syntax is not readable", function(done) {
      Routes.get("/foo","FooController")

      server.start('0.0.0.0', 4000)

      api()
        .base('http://localhost:4000')
        .get('/foo')
        .expectStatus(503)
        .end(function(err, res, body) {
          if (err) done(err)
          else done();
        })
    });

    it("should spyn a server on given port and respond to a registered route", function(done) {
      let usersToReturn = [{
        username: 'foo',
        age: 22
      }, {
        username: 'bar',
        age: 25
      }];

      Routes.get("/user", function*(request, response) {
        let users = yield getData(usersToReturn);
        if (users) {
          response.status(200).send(users);
        }
      });

      server.start('0.0.0.0', 4000)

      api()
        .json()
        .base('http://localhost:4000')
        .get('/user')
        .expectStatus(200)
        .expectBody(usersToReturn)
        .end(function(err, res, body) {
          if (err) done(err)
          else{
            done();
          }
        })

    });

  it('should start a server and attach multiple middlewares to a given route', function (done) {
    let usersToReturn = [{
      username: 'foo',
      age: 22
    }, {
      username: 'bar',
      age: 25
    }]

    Ioc.dump('App/Middleware/Auth', path.join(__dirname, './app/Http/Middlewares/Auth'))
    Ioc.dump('App/Middleware/Admin', path.join(__dirname, './app/Http/Middlewares/Admin'))

    Middlewares.named({
      'auth': 'App/Middleware/Auth',
      'admin': 'App/Middleware/Admin'
    })

    Routes.get('/frameworks', function *(request, response) {
      let users = yield getData(usersToReturn)
      if (users) {
        response.status(200).send(users)
      }
    }).middlewares(['auth', 'admin'])

    server.start('0.0.0.0', 4000)

    api()
      .json()
      .header('framework', 'adonis')
      .base('http://localhost:4000')
      .get('/frameworks')
      .expectStatus(200)
      .expectBody(usersToReturn)
      .end(function (err, res, body) {
        if (err) done(err)
        done()
      })
  })

  it('should abort request when middlewares do not yield to next', function (done) {
    let errorMessage = 'Hulk should be green'

    Ioc.dump('App/Middleware/HulkTest', path.join(__dirname, './app/Http/Middlewares/HulkTest'))

    Middlewares.named({
      'auth': 'App/Middleware/HulkTest'
    })

    const getUsers = function () {
      return 'foo'
    }

    Routes.get('/hulk', function *(request, response) {
      let users = yield getUsers()
      if (users) {
        response.status(200).send(users)
      }
    }).middlewares(['auth'])

    server.start('0.0.0.0', 4000)

    api()
      .header('color', 'red')
      .base('http://localhost:4000')
      .get('/hulk')
      .expectStatus(400)
      .expectBody(errorMessage)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        done()
      })
  })

  it('should serve static resources', function (done) {
    Static.public('dist', path.join(__dirname, './public'))

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/dist/style.css')
      .expectStatus(200)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        let cssRegex = new RegExp('(?:\\s*\\S+\\s*{[^}]*})+', 'g')
        expect(cssRegex.test(body)).to.equal(true)
        done()
      })
  })

  it('should serve favicon from a given path', function (done) {
    Static.favicon(path.join(__dirname, './public/favicon.ico'))

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/favicon.ico')
      .expectStatus(200)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        else done()
      })
  })

  it('should resolve controllers using controller string and using resource method', function (done) {
    Routes.resource('/friends', 'Friends')

    let friendsToReturn = [
      {
        name: 'foo'
      },
      {
        name: 'bar'
      }
    ]

    server.start('0.0.0.0', 4000)

    api()
      .json()
      .base('http://localhost:4000')
      .get('/friends')
      .expectStatus(200)
      .expectBody(friendsToReturn)
      .end(function (err, res, body) {
        if (err) {
          done(err)
        } else {
          done()
        }
      })
  })

  it('should resolve nested controllers using controller string', function (done) {
    Routes.group('admin', function () {
      Routes.resource('/friends', 'Admin/Friends')
    }).prefix('/admin').close()

    let friendsToReturn = [
      {
        name: 'admin-foo'
      },
      {
        name: 'admin-bar'
      }
    ]

    server.start('0.0.0.0', 4000)

    api()
      .json()
      .base('http://localhost:4000')
      .get('/admin/friends')
      .expectStatus(200)
      .expectBody(friendsToReturn)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        done()
      })
  })

  it('should resolve nested controllers using controller string with full namespace', function (done) {
    Routes.group('admin', function () {
      Routes.resource('/friends', 'App/Http/Controllers/Admin/Friends')
    }).prefix('/v1/admin').close()

    let friendsToReturn = [
      {
        name: 'admin-foo'
      },
      {
        name: 'admin-bar'
      }
    ]

    server.start('0.0.0.0', 4000)

    api()
      .json()
      .base('http://localhost:4000')
      .get('/v1/admin/friends')
      .expectStatus(200)
      .expectBody(friendsToReturn)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        done()
      })
  })

  it('should serve static resources even when all routes are listening to a single controller action', function (done) {
    Routes.get('*', function *(request, response) {
      response.send('foo')
    })

    Static.public('dist', path.join(__dirname, './public'))

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/dist/style.css')
      .expectStatus(200)
      .end(function (err, res, body) {
        if (err) done(err.stack)
        let cssRegex = new RegExp('(?:\\s*\\S+\\s*{[^}]*})+', 'g')
        expect(cssRegex.test(body)).to.equal(true)
        done()
      })
  })

  it('should throw an error when unable to find static resource', function (done) {
    Static.public('dist', path.join(__dirname, './public'))

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/dist/foo')
      .expectStatus(404)
      .end(function (err, res, body) {
        if (err) done(err)
        else done()
      })
  })

  it('should not call send method when returned value from controller is instance of response object', function (done) {
    Routes.get('/response', function *(request, response) {
      return response.send('foo')
    })

    server.start('0.0.0.0', 4000)

    api()
      .base('http://localhost:4000')
      .get('/response')
      .expectStatus(200)
      .end(function (err, res, body) {
        if (err) {
          done(err)
        } else {
          expect(body.trim()).to.equal('foo')
          done()
        }
      })
  })
})
