'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Route = require('../../src/Route')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect

describe('Route',function () {

  beforeEach(function () {
    Route.new()
  })

  context('Register', function () {

    it('should register a route with GET verb', function () {
      Route.get('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET', 'HEAD'])
    })

    it('should register a route with POST verb', function () {
      Route.post('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['POST'])
    })

    it('should register a route with PUT verb', function () {
      Route.put('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['PUT'])
    })

    it('should register a route with DELETE verb', function () {
      Route.delete('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['DELETE'])
    })

    it('should register a route with PATCH verb', function () {
      Route.patch('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['PATCH'])
    })

    it('should register a route with OPTIONS verb', function () {
      Route.options('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['OPTIONS'])
    })

    it('should register a route with multiple verbs using match method', function () {
      Route.match(['get','post'],'/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET','POST'])
    })

    it('should register a route for all verbs using any method', function () {
      Route.any('/','SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET','POST','PUT','PATCH','DELETE','OPTIONS'])
    })

    it('should register resourceful routes', function () {
      Route.resource('/','SomeController')
      const routes = Route.routes()
      const verbs = _.object(_.map(routes, function (route) {
        return [route.route + '-' + route.verb[0],true]
      }))
      expect(routes.length).to.equal(6)
      expect(verbs['/-OPTIONS']).not.to.equal(undefined)
      expect(verbs['/-GET']).not.to.equal(undefined)
      expect(verbs['/-POST']).not.to.equal(undefined)
      expect(verbs['/:id-GET']).not.to.equal(undefined)
      expect(verbs['/:id-PUT']).not.to.equal(undefined)
      expect(verbs['/:id-DELETE']).not.to.equal(undefined)
    })

    it('should register resourceful routes when base route is not /', function () {
      Route.resource('/admin','SomeController')
      const routes = Route.routes()
      const verbs = _.object(_.map(routes, function (route) {
        return [route.route + '-' + route.verb[0],true]
      }))
      expect(routes.length).to.equal(6)
      expect(verbs['/admin-OPTIONS']).not.to.equal(undefined)
      expect(verbs['/admin-GET']).not.to.equal(undefined)
      expect(verbs['/admin-POST']).not.to.equal(undefined)
      expect(verbs['/admin/:id-GET']).not.to.equal(undefined)
      expect(verbs['/admin/:id-PUT']).not.to.equal(undefined)
      expect(verbs['/admin/:id-DELETE']).not.to.equal(undefined)
    })


    it('should be able to name routes', function () {
      Route.any('/','SomeController.method').as('home')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].name).to.equal('home')
    })

    it('should be able to attach middlewares to a given route', function () {
      Route.any('/','SomeController.method').middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth'])
    })

    it('should be able to group routes', function () {
      Route.group('admin',function () {
        Route.get('/','SomeController.method')
      })
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
    })

    it('should be able to attach middleware to group routes', function () {
      Route.group('admin',function () {
        Route.get('/','SomeController.method')
      }).middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
      expect(routes[0].middlewares).deep.equal(['auth'])
    })

    it('should be able to attach middleware to group routes and isolated middleware to routes inside group', function () {
      Route.group('admin',function () {
        Route.get('/','SomeController.method')
        Route.get('/cors','SomeController.method').middlewares(['cors'])
      }).middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
      expect(routes[0].middlewares).deep.equal(['auth'])
      expect(routes[1].group).to.equal('admin')
      expect(routes[1].middlewares).deep.equal(['cors','auth'])
    })

    it('should be able to prefix routes inside a group', function () {
      Route.group('admin',function () {
        Route.get('/','SomeController.method')
      }).prefix('/v1')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].route).to.equal('/v1')
    })


    it('should prefix all resourceful routes under a group', function () {
      Route.group('admin',function () {
        Route.resource('/','SomeController')
      }).prefix('/v1')
      const routes = Route.routes()
      const verbs = _.object(_.map(routes, function (route) {
        return [route.route + '-' + route.verb[0],true]
      }))
      expect(routes.length).to.equal(6)
      expect(verbs['/v1-OPTIONS']).not.to.equal(undefined)
      expect(verbs['/v1-GET']).not.to.equal(undefined)
      expect(verbs['/v1-POST']).not.to.equal(undefined)
      expect(verbs['/v1/:id-GET']).not.to.equal(undefined)
      expect(verbs['/v1/:id-PUT']).not.to.equal(undefined)
      expect(verbs['/v1/:id-DELETE']).not.to.equal(undefined)

    })

    it('should be able to define subdomain for a given route', function () {
      Route.group('admin',function () {
        Route.get('/','SomeController.method')
      }).domain('v1.example.org')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].subdomain).to.equal('v1.example.org')
    })

  })

  context('Resolve', function () {

    it('should return an empty object when unable to resolve route', function () {

      const home = Route.resolve('/','GET')
      expect(home).deep.equal({})
    })

    it('should resolve a given route', function () {

      Route.get('/','SomeController.method')
      const home = Route.resolve('/','GET')
      expect(home.route).to.equal('/')
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal(null)
      expect(home.middlewares).deep.equal([])
      expect(home.subdomain).to.equal(null)
      expect(home.params).deep.equal({})

    })

    it('should return route arguments', function () {
      Route.get('/:id', 'SomeController.method')
      const home = Route.resolve('/1','GET')
      expect(home.params).deep.equal({id:"1"})
    })

    it('should resolve a route prefixed via group', function () {

      Route.group('v1',function () {
        Route.get('/','SomeController.method')
      }).prefix('/v1')

      const home = Route.resolve('/v1','GET')
      expect(home.route).to.equal('/v1')
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal('v1')
      expect(home.middlewares).deep.equal([])
      expect(home.subdomain).to.equal(null)
      expect(home.params).deep.equal({})

    })

    it('should resolve a route registered with multiple verbs', function () {

      Route.match(['get','post'], '/', 'SomeController.method')

      const home = Route.resolve('/','GET')
      expect(home.route).to.equal('/')
      expect(home.verb).deep.equal(['GET','POST'])
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal(null)
      expect(home.middlewares).deep.equal([])
      expect(home.subdomain).to.equal(null)
      expect(home.params).deep.equal({})

    })

    it('should return route middlewares if registered with route', function () {
      Route.get('/', 'SomeController.method').middlewares(['auth'])
      const home = Route.resolve('/','GET')
      expect(home.middlewares).deep.equal(['auth'])
    })

    it('should return route middlewares registered on group', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).middlewares(['auth'])
      const home = Route.resolve('/','GET')
      expect(home.middlewares).deep.equal(['auth'])
    })

    it('should return route middlewares registered on group and on route as well', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method').middlewares(['cors'])
      }).middlewares(['auth'])
      const home = Route.resolve('/','GET')
      expect(home.middlewares).deep.equal(['cors','auth'])
    })

    it('should resolve routes with subdomains', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).domain('virk.me')
      const home = Route.resolve('/','GET','virk.me')
      expect(home.route).to.equal('/')
      expect(home.handler).to.equal('SomeController.method')
    })

    it('should not resolve paths defined inside subdomain without host', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).domain('virk.me')
      const home = Route.resolve('/','GET')
      expect(home).deep.equal({})
    })

  })

  context('Building Url', function () {

    it('should make url for any url , even if not registered inside routes', function () {
      const url = Route.url('http://amanvirk.me/:post',{post:'hello-world'})
      expect(url).to.equal('http://amanvirk.me/hello-world')
    })

    it('should make for any given route', function () {
      Route.get('/:post','SomeController.index')
      const url = Route.url('/:post',{post:'hello-world'})
      expect(url).to.equal('/hello-world')
    })

    it('should make url for a named route', function () {
      Route.get('/:post','SomeController.index').as('post')
      const url = Route.url('post',{post:'hello-world'})
      expect(url).to.equal('/hello-world')
    })

    it('should make url for a prefixed named route', function () {
      Route.group('v1', function () {
        Route.get('/:post','SomeController.index').as('post')
      }).prefix('/v1')
      const url = Route.url('post',{post:'hello-world'})
      expect(url).to.equal('/v1/hello-world')
    })

    it('should make url for route registered inside subdomain', function () {
      Route.group('v1', function () {
        Route.get('/:post','SomeController.index').as('post')
      }).domain('amanvirk.me')
      const url = Route.url('post',{post:'hello-world'})
      expect(url).to.equal('amanvirk.me/hello-world')
    })


  })


})
