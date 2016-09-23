'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Route = require('../../src/Route')
const chai = require('chai')
const _ = require('lodash')
const expect = chai.expect
const stderr = require('test-console').stderr
require('co-mocha')

describe('Route', function () {
  beforeEach(function () {
    Route.new()
  })

  context('Register', function () {
    it('should register a route with GET verb', function () {
      Route.get('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET', 'HEAD'])
    })

    it('should register a route with POST verb', function () {
      Route.post('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['POST'])
    })

    it('should add / when route defination does not have one', function () {
      Route.post('admin', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].route).to.equal('/admin')
    })

    it('should register a route with PUT verb', function () {
      Route.put('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['PUT'])
    })

    it('should register a route with DELETE verb', function () {
      Route.delete('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['DELETE'])
    })

    it('should register a route with PATCH verb', function () {
      Route.patch('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['PATCH'])
    })

    it('should register a route with OPTIONS verb', function () {
      Route.options('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['OPTIONS'])
    })

    it('should register a route with multiple verbs using match method', function () {
      Route.match(['get', 'post'], '/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET', 'POST'])
    })

    it('should register a route for all verbs using any method', function () {
      Route.any('/', 'SomeController.method')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].handler).to.equal('SomeController.method')
      expect(routes[0].verb).deep.equal(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    })

    it('should throw an error when handler binded to resource is not a controller', function () {
      const fn = function () {
        Route.resource('/', function * () {})
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_PARAMETER: You can only bind controllers to resources')
    })

    it('should log warning when trying to bind resource to the base route', function () {
      const inspect = stderr.inspect()
      Route.resource('/', 'HomeController')
      inspect.restore()
      expect(inspect.output[inspect.output.length - 2].trim()).to.match(/You are registering a resource for \/ path, which is not a good practice/)
    })

    it("should be able to get a route with it's name", function () {
      Route.get('/user/:id', 'UsersController.show').as('user.show')
      const route = Route.getRoute({name: 'user.show'})
      expect(route).to.be.an('object')
      expect(route.handler).to.equal('UsersController.show')
    })

    it("should be able to get a route with it's handler name", function () {
      Route.get('/user/:id', 'UsersController.show').as('user.show')
      const route = Route.getRoute({handler: 'UsersController.show'})
      expect(route).to.be.an('object')
      expect(route.name).to.equal('user.show')
    })

    it('should register resourceful routes', function () {
      Route.resource('/', 'SomeController')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/-POST']).to.equal('SomeController.store')
      expect(verbs['/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/:id-DELETE']).to.equal('SomeController.destroy')
    })

    it('should not have / in resourceful routes', function () {
      Route.resource('/', 'SomeController')
      const routes = Route.routes()
      const names = _.map(routes, function (route) {
        return route.name
      })
      expect(routes.length).to.equal(7)
      expect(names).deep.equal(['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'])
    })

    it('should register resourceful routes when base route is not /', function () {
      Route.resource('/admin', 'SomeController')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/admin-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/admin/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/admin-POST']).to.equal('SomeController.store')
      expect(verbs['/admin/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/admin/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/admin/:id-DELETE']).to.equal('SomeController.destroy')
    })

    it('should not have / in resourceful routes when resourceful is not /', function () {
      Route.resource('/admin', 'SomeController')
      const routes = Route.routes()
      const names = _.map(routes, function (route) {
        return route.name
      })
      expect(routes.length).to.equal(7)
      expect(names).deep.equal(['admin.index', 'admin.create', 'admin.store', 'admin.show', 'admin.edit', 'admin.update', 'admin.destroy'])
    })

    it('should not have / in resourceful routes when resourceful does not starts with /', function () {
      Route.resource('admin', 'SomeController')
      const routes = Route.routes()
      const names = _.map(routes, function (route) {
        return route.name
      })
      expect(routes.length).to.equal(7)
      expect(names).deep.equal(['admin.index', 'admin.create', 'admin.store', 'admin.show', 'admin.edit', 'admin.update', 'admin.destroy'])
    })

    it('should be able to name routes', function () {
      Route.any('/', 'SomeController.method').as('home')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].name).to.equal('home')
    })

    it('should be able to attach middlewares to a given route', function () {
      Route.any('/', 'SomeController.method').middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth'])
    })

    it('should be able to attach middlewares as multiple parameters', function () {
      Route.any('/', 'SomeController.method').middlewares('auth', 'web')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth', 'web'])
    })

    it('should be able to attach middlewares using middleware method', function () {
      Route.any('/', 'SomeController.method').middleware('auth', 'web')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth', 'web'])
    })

    it('should be able to group routes', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      })
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
    })

    it('should be able to attach middleware to group routes', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
      expect(routes[0].middlewares).deep.equal(['auth'])
    })

    it('should be able to attach middlewares as multiple parameters on a group', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).middlewares('auth', 'web')

      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth', 'web'])
    })

    it('should be able to attach middlewares using middleware method', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).middleware('auth', 'web')

      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].middlewares).deep.equal(['auth', 'web'])
    })

    it('should be able to attach middleware to group routes and isolated middleware to routes inside group', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
        Route.get('/cors', 'SomeController.method').middlewares(['cors'])
      }).middlewares(['auth'])
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].group).to.equal('admin')
      expect(routes[0].middlewares).deep.equal(['auth'])
      expect(routes[1].group).to.equal('admin')
      expect(routes[1].middlewares).deep.equal(['cors', 'auth'])
    })

    it('should be able to prefix routes inside a group', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).prefix('/v1')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].route).to.equal('/v1')
    })

    it('should prefix all resourceful routes under a group', function () {
      Route.group('v1', function () {
        Route.resource('admin', 'SomeController')
      }).prefix('/v1')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/v1/admin-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/v1/admin/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/v1/admin-POST']).to.equal('SomeController.store')
      expect(verbs['/v1/admin/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/v1/admin/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/v1/admin/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/v1/admin/:id-DELETE']).to.equal('SomeController.destroy')
    })

    it('should be able to create nested resources seperated with dots', function () {
      Route.resource('user.posts', 'PostController')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal('PostController.index')
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal('PostController.create')
      expect(verbs['/user/:user_id/posts-POST']).to.equal('PostController.store')
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal('PostController.show')
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal('PostController.edit')
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal('PostController.update')
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal('PostController.destroy')
    })

    it('should create proper names for nested routes', function () {
      Route.resource('user.posts', 'SomeController')
      const routes = Route.routes()
      const names = _.map(routes, function (route) {
        return route.name
      })
      expect(routes.length).to.equal(7)
      expect(names).deep.equal(['user.posts.index', 'user.posts.create', 'user.posts.store', 'user.posts.show', 'user.posts.edit', 'user.posts.update', 'user.posts.destroy'])
    })

    it('should be able to create end number of nested resources seperated with dots', function () {
      Route.resource('user.post.comments', 'CommentsController')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/user/:user_id/post/:post_id/comments-GET/HEAD']).to.equal('CommentsController.index')
      expect(verbs['/user/:user_id/post/:post_id/comments/create-GET/HEAD']).to.equal('CommentsController.create')
      expect(verbs['/user/:user_id/post/:post_id/comments-POST']).to.equal('CommentsController.store')
      expect(verbs['/user/:user_id/post/:post_id/comments/:id-GET/HEAD']).to.equal('CommentsController.show')
      expect(verbs['/user/:user_id/post/:post_id/comments/:id/edit-GET/HEAD']).to.equal('CommentsController.edit')
      expect(verbs['/user/:user_id/post/:post_id/comments/:id-PUT/PATCH']).to.equal('CommentsController.update')
      expect(verbs['/user/:user_id/post/:post_id/comments/:id-DELETE']).to.equal('CommentsController.destroy')
    })

    it('should be define same resource under a group and without a group', function () {
      Route.resource('users', 'UsersController')
      Route.group('v', function () {
        Route.resource('users', 'V1UsersController')
      }).prefix('/v1')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(14)
      expect(verbs['/users-GET/HEAD']).to.equal('UsersController.index')
      expect(verbs['/v1/users-GET/HEAD']).to.equal('V1UsersController.index')

      expect(verbs['/users/create-GET/HEAD']).to.equal('UsersController.create')
      expect(verbs['/v1/users/create-GET/HEAD']).to.equal('V1UsersController.create')

      expect(verbs['/users-POST']).to.equal('UsersController.store')
      expect(verbs['/v1/users-POST']).to.equal('V1UsersController.store')

      expect(verbs['/users/:id-GET/HEAD']).to.equal('UsersController.show')
      expect(verbs['/v1/users/:id-GET/HEAD']).to.equal('V1UsersController.show')

      expect(verbs['/users/:id/edit-GET/HEAD']).to.equal('UsersController.edit')
      expect(verbs['/v1/users/:id/edit-GET/HEAD']).to.equal('V1UsersController.edit')

      expect(verbs['/users/:id-DELETE']).to.equal('UsersController.destroy')
      expect(verbs['/v1/users/:id-DELETE']).to.equal('V1UsersController.destroy')
    })

    it('should be define same resource under a group and without a group binded to same controller', function () {
      Route.resource('users', 'UsersController')
      Route.group('v', function () {
        Route.resource('users', 'UsersController')
      }).prefix('/v1')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(14)
      expect(verbs['/users-GET/HEAD']).to.equal('UsersController.index')
      expect(verbs['/v1/users-GET/HEAD']).to.equal('UsersController.index')

      expect(verbs['/users/create-GET/HEAD']).to.equal('UsersController.create')
      expect(verbs['/v1/users/create-GET/HEAD']).to.equal('UsersController.create')

      expect(verbs['/users-POST']).to.equal('UsersController.store')
      expect(verbs['/v1/users-POST']).to.equal('UsersController.store')

      expect(verbs['/users/:id-GET/HEAD']).to.equal('UsersController.show')
      expect(verbs['/v1/users/:id-GET/HEAD']).to.equal('UsersController.show')

      expect(verbs['/users/:id/edit-GET/HEAD']).to.equal('UsersController.edit')
      expect(verbs['/v1/users/:id/edit-GET/HEAD']).to.equal('UsersController.edit')

      expect(verbs['/users/:id-PUT/PATCH']).to.equal('UsersController.update')

      expect(verbs['/users/:id-DELETE']).to.equal('UsersController.destroy')
      expect(verbs['/v1/users/:id-DELETE']).to.equal('UsersController.destroy')
    })

    it('all route resources should have a name', function () {
      Route.resource('user.posts', 'PostController')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal('user.posts.index')
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal('user.posts.create')
      expect(verbs['/user/:user_id/posts-POST']).to.equal('user.posts.store')
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal('user.posts.show')
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal('user.posts.edit')
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal('user.posts.update')
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal('user.posts.destroy')
    })

    it('should be able to override route resource names', function () {
      Route.resource('user.posts', 'PostController').as({
        edit: 'post.showEdit',
        destroy: 'post.remove'
      })
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(7)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal('user.posts.index')
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal('user.posts.create')
      expect(verbs['/user/:user_id/posts-POST']).to.equal('user.posts.store')
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal('user.posts.show')
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal('post.showEdit')
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal('user.posts.update')
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal('post.remove')
    })

    it('should be able to define route required routes for a resource', function () {
      Route.resource('user.posts', 'PostController').only(['create', 'store', 'index'])
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(3)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal('user.posts.index')
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal('user.posts.create')
      expect(verbs['/user/:user_id/posts-POST']).to.equal('user.posts.store')
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal(undefined)
    })

    it('should be able to define route required routes for a resource as multiple parameters', function () {
      Route.resource('user.posts', 'PostController').only('create', 'store', 'index')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(3)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal('user.posts.index')
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal('user.posts.create')
      expect(verbs['/user/:user_id/posts-POST']).to.equal('user.posts.store')
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal(undefined)
    })

    it('should be able to define route actions not required when creating resources', function () {
      Route.resource('user.posts', 'PostController').except(['create', 'store', 'index'])
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(4)
      expect(verbs['/user/:user_id/posts-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/create-GET/HEAD']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts-POST']).to.equal(undefined)
      expect(verbs['/user/:user_id/posts/:id-GET/HEAD']).to.equal('user.posts.show')
      expect(verbs['/user/:user_id/posts/:id/edit-GET/HEAD']).to.equal('user.posts.edit')
      expect(verbs['/user/:user_id/posts/:id-PUT/PATCH']).to.equal('user.posts.update')
      expect(verbs['/user/:user_id/posts/:id-DELETE']).to.equal('user.posts.destroy')
    })

    it('should filter routes from resource routes copy also when using except', function () {
      Route
        .resource('user.posts', 'PostController')
        .except(['create', 'store', 'index'])
        .as({
          store: 'users.save'
        })
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(verbs['/user/:user_id/posts-POST']).to.equal(undefined)
    })

    it('should be able to define domain for a given route', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).domain('v1.example.org')
      const routes = Route.routes()
      expect(routes[0]).to.be.an('object')
      expect(routes[0].domain).to.equal('v1.example.org')
    })

    it('should be able to define formats on routes', function () {
      Route.get('/', 'HomeController.index').formats(['json'])
      const routes = Route.routes()
      expect(routes[0].route).to.equal('/:format(.json)?')
    })

    it('should be able to define multiple formats on routes', function () {
      Route.get('/', 'HomeController.index').formats(['json', 'xml'])
      const routes = Route.routes()
      expect(routes[0].route).to.equal('/:format(.json|.xml)?')
    })

    it('should be able to define formats on routes and make format strict', function () {
      Route.get('/', 'HomeController.index').formats(['json'], true)
      const routes = Route.routes()
      expect(routes[0].route).to.equal('/:format(.json)')
    })

    it('should be able to define formats on group of routes', function () {
      Route.group('v2', function () {
        Route.get('/users', 'UsersController.index')
        Route.get('/posts', 'PostController.index')
      }).formats(['json'])
      const routes = Route.routes()
      expect(routes[0].route).to.equal('/users:format(.json)?')
      expect(routes[1].route).to.equal('/posts:format(.json)?')
    })

    it('should be able to define strict formats on group of routes', function () {
      Route.group('v2', function () {
        Route.get('/users', 'UsersController.index')
        Route.get('/posts', 'PostController.index')
      }).formats(['json'], true)
      const routes = Route.routes()
      expect(routes[0].route).to.equal('/users:format(.json)')
      expect(routes[1].route).to.equal('/posts:format(.json)')
    })

    it('should be able to define formats on resources', function () {
      Route.resource('users', 'UsersController').formats(['json'])
      const routes = Route.routes()
      const routePairs = _.map(routes, function (route) {
        return route.route
      })
      expect(routePairs.length).to.equal(7)
      routePairs.forEach(function (item) {
        expect(item).to.match(/:format(json)?/g)
      })
    })

    it('should register resourceful routes with member paths', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed', ['GET', 'HEAD'])
        .addMember('mark_as', 'POST')

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(9)
      expect(verbs['/tasks-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/tasks/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/tasks-POST']).to.equal('SomeController.store')
      expect(verbs['/tasks/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/tasks/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/tasks/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/tasks/:id-DELETE']).to.equal('SomeController.destroy')
      expect(verbs['/tasks/:id/completed-GET/HEAD']).to.equal('SomeController.completed')
      expect(verbs['/tasks/:id/mark_as-POST']).to.equal('SomeController.mark_as')
    })

    it('should be able to add member paths to nested resources', function () {
      Route
        .resource('user.tasks', 'SomeController')
        .addMember('completed', 'PUT')

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(verbs['/user/:user_id/tasks/:id/completed-PUT']).to.equal('SomeController.completed')
    })

    it('should make use of GET and HEAD verbs when no verbs are defined with addMember', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed')

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(verbs['/tasks/:id/completed-GET/HEAD']).to.equal('SomeController.completed')
    })

    it('should throw an error when the action is not present for member route', function () {
      const fn = function () {
        Route.resource('/tasks', 'SomeController').addMember()
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_PARAMETER: Resource.addMember expects a route')
    })

    it('should update controller binding for added member', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed', ['GET', 'HEAD'], function (member) {
          member.bindAction('SomeController.getCompleted')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(routes.length).to.equal(8)
      expect(verbs['/tasks-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/tasks/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/tasks-POST']).to.equal('SomeController.store')
      expect(verbs['/tasks/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/tasks/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/tasks/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/tasks/:id-DELETE']).to.equal('SomeController.destroy')
      expect(verbs['/tasks/:id/completed-GET/HEAD']).to.equal('SomeController.getCompleted')
    })

    it('should be able to assign middleware to the member', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed', ['GET', 'HEAD'], function (member) {
          member.bindAction('SomeController.getCompleted').middleware('auth')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))
      expect(routes.length).to.equal(8)
      expect(verbs['/tasks/:id/completed-GET/HEAD']).deep.equal(['auth'])
    })

    it('should be able to update member route name', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed', ['GET', 'HEAD'], function (member) {
          member.bindAction('SomeController.getCompleted').as('getCompletedTasks')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))
      expect(routes.length).to.equal(8)
      expect(verbs['/tasks/:id/completed-GET/HEAD']).deep.equal('getCompletedTasks')
    })

    it('should return route defination using toJSON method', function () {
      let resourceMember = {}
      Route
        .resource('/tasks', 'SomeController')
        .addMember('completed', ['GET', 'HEAD'], function (member) {
          resourceMember = member.toJSON()
        })
      expect(resourceMember).to.be.an('object')
      expect(resourceMember.verb).deep.equal(['GET', 'HEAD'])
      expect(resourceMember.handler).to.equal('SomeController.completed')
      expect(resourceMember.middlewares).deep.equal([])
      expect(resourceMember.name).to.equal('tasks.completed')
    })

    it('should register resourceful routes with collection paths', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addCollection('completed', ['GET', 'HEAD'])
        .addCollection('mark_as', 'POST')

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))

      expect(routes.length).to.equal(9)
      expect(verbs['/tasks-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/tasks/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/tasks-POST']).to.equal('SomeController.store')
      expect(verbs['/tasks/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/tasks/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/tasks/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/tasks/:id-DELETE']).to.equal('SomeController.destroy')
      expect(verbs['/tasks/completed-GET/HEAD']).to.equal('SomeController.completed')
      expect(verbs['/tasks/mark_as-POST']).to.equal('SomeController.mark_as')
    })

    it('should be able to add collection paths to nested resources', function () {
      Route
        .resource('user.tasks', 'SomeController')
        .addCollection('completed', ['GET', 'HEAD'])

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(verbs['/user/:user_id/tasks/completed-GET/HEAD']).to.equal('SomeController.completed')
    })

    it('should make use of GET and HEAD verbs when no verbs are defined with addCollection', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addCollection('completed')

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))
      expect(verbs['/tasks/completed-GET/HEAD']).to.equal('SomeController.completed')
    })

    it('should throw an error when the action is not present for collection route', function () {
      const fn = function () {
        Route
          .resource('/tasks', 'SomeController')
          .addCollection()
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_PARAMETER: Resource.addCollection expects a route')
    })

    it('should be able to bind controller action to the resource collection', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addCollection('completed', ['GET', 'HEAD'], function (collection) {
          collection.bindAction('SomeController.getCompletedTasks')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.handler]
      }))

      expect(routes.length).to.equal(8)
      expect(verbs['/tasks-GET/HEAD']).to.equal('SomeController.index')
      expect(verbs['/tasks/create-GET/HEAD']).to.equal('SomeController.create')
      expect(verbs['/tasks-POST']).to.equal('SomeController.store')
      expect(verbs['/tasks/:id-GET/HEAD']).to.equal('SomeController.show')
      expect(verbs['/tasks/:id/edit-GET/HEAD']).to.equal('SomeController.edit')
      expect(verbs['/tasks/:id-PUT/PATCH']).to.equal('SomeController.update')
      expect(verbs['/tasks/:id-DELETE']).to.equal('SomeController.destroy')
      expect(verbs['/tasks/completed-GET/HEAD']).to.equal('SomeController.getCompletedTasks')
    })

    it('should be able to assign middleware to the resource collection', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addCollection('completed', ['GET', 'HEAD'], function (collection) {
          collection.middleware('auth')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))

      expect(routes.length).to.equal(8)
      expect(verbs['/tasks/completed-GET/HEAD']).deep.equal(['auth'])
    })

    it('should be able to change route name for the resource collection', function () {
      Route
        .resource('/tasks', 'SomeController')
        .addCollection('completed', ['GET', 'HEAD'], function (collection) {
          collection.as('tasks.getCompleted')
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))

      expect(routes.length).to.equal(8)
      expect(verbs['/tasks/completed-GET/HEAD']).deep.equal('tasks.getCompleted')
    })

    it('should be able to override collection route name', function () {
      Route
        .resource('/posts', 'PostController')
        .addCollection('thrending', ['GET', 'HEAD'])
        .as({
          thrending: 'posts.threndingPosts'
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))

      expect(routes.length).to.equal(8)
      expect(verbs['/posts-GET/HEAD']).to.equal('posts.index')
      expect(verbs['/posts/create-GET/HEAD']).to.equal('posts.create')
      expect(verbs['/posts-POST']).to.equal('posts.store')
      expect(verbs['/posts/:id-GET/HEAD']).to.equal('posts.show')
      expect(verbs['/posts/:id/edit-GET/HEAD']).to.equal('posts.edit')
      expect(verbs['/posts/:id-PUT/PATCH']).to.equal('posts.update')
      expect(verbs['/posts/:id-DELETE']).to.equal('posts.destroy')
      expect(verbs['/posts/thrending-GET/HEAD']).to.equal('posts.threndingPosts')
    })

    it('should be able to override member route name', function () {
      Route
        .resource('/posts', 'PostController')
        .addMember('preview', ['GET', 'HEAD'])
        .as({
          preview: 'posts.previewPost'
        })

      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.name]
      }))

      expect(routes.length).to.equal(8)
      expect(verbs['/posts-GET/HEAD']).to.equal('posts.index')
      expect(verbs['/posts/create-GET/HEAD']).to.equal('posts.create')
      expect(verbs['/posts-POST']).to.equal('posts.store')
      expect(verbs['/posts/:id-GET/HEAD']).to.equal('posts.show')
      expect(verbs['/posts/:id/edit-GET/HEAD']).to.equal('posts.edit')
      expect(verbs['/posts/:id-PUT/PATCH']).to.equal('posts.update')
      expect(verbs['/posts/:id-DELETE']).to.equal('posts.destroy')
      expect(verbs['/posts/:id/preview-GET/HEAD']).to.equal('posts.previewPost')
    })
  })

  context('Resolve', function () {
    it('should return an empty object when unable to resolve route', function () {
      const home = Route.resolve('/', 'GET')
      expect(home).deep.equal({})
    })

    it('should resolve a given route', function () {
      Route.get('/', 'SomeController.method')
      const home = Route.resolve('/', 'GET')
      expect(home.route).to.equal('/')
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal(null)
      expect(home.middlewares).deep.equal([])
      expect(home.domain).to.equal(null)
      expect(home.params).deep.equal({})
    })

    it('should return route arguments', function () {
      Route.get('/:id', 'SomeController.method')
      const home = Route.resolve('/1', 'GET')
      expect(home.params).deep.equal({id: '1'})
    })

    it('should resolve a route prefixed via group', function () {
      Route.group('v1', function () {
        Route.get('/', 'SomeController.method')
      }).prefix('/v1')

      const home = Route.resolve('/v1', 'GET')
      expect(home.route).to.equal('/v1')
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal('v1')
      expect(home.middlewares).deep.equal([])
      expect(home.domain).to.equal(null)
      expect(home.params).deep.equal({})
    })

    it('should resolve a route registered with multiple verbs', function () {
      Route.match(['get', 'post'], '/', 'SomeController.method')
      const home = Route.resolve('/', 'GET')
      expect(home.route).to.equal('/')
      expect(home.verb).deep.equal(['GET', 'POST'])
      expect(home.matchedVerb).to.equal('GET')
      expect(home.handler).to.equal('SomeController.method')
      expect(home.group).to.equal(null)
      expect(home.middlewares).deep.equal([])
      expect(home.domain).to.equal(null)
      expect(home.params).deep.equal({})
    })

    it('should return route middlewares if registered with route', function () {
      Route.get('/', 'SomeController.method').middlewares(['auth'])
      const home = Route.resolve('/', 'GET')
      expect(home.middlewares).deep.equal(['auth'])
    })

    it('should return route middlewares registered on group', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).middlewares(['auth'])
      const home = Route.resolve('/', 'GET')
      expect(home.middlewares).deep.equal(['auth'])
    })

    it('should return route middlewares registered on group and on route as well', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method').middlewares(['cors'])
      }).middlewares(['auth'])
      const home = Route.resolve('/', 'GET')
      expect(home.middlewares).deep.equal(['cors', 'auth'])
    })

    it('should resolve routes with domains', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).domain('virk.me')
      const home = Route.resolve('/', 'GET', 'virk.me')
      expect(home.route).to.equal('/')
      expect(home.handler).to.equal('SomeController.method')
    })

    it('should not resolve paths defined inside domain without host', function () {
      Route.group('admin', function () {
        Route.get('/', 'SomeController.method')
      }).domain('virk.me')
      const home = Route.resolve('/', 'GET')
      expect(home).deep.equal({})
    })

    it('should resolve routes registered as resource', function () {
      Route.resource('users', 'UsersController')
      const usersIndex = Route.resolve('/users', 'GET')
      expect(usersIndex.name).to.equal('users.index')
      expect(usersIndex.handler).to.equal('UsersController.index')
    })

    it('should resolve routes registered as nested resource', function () {
      Route.resource('users.posts', 'PostController')
      const postsIndex = Route.resolve('/users/1/posts', 'GET')
      expect(postsIndex.name).to.equal('users.posts.index')
      expect(postsIndex.handler).to.equal('PostController.index')
    })

    it('should resolve routes registered as resource under a group', function () {
      Route.group('v1', function () {
        Route.resource('users.posts', 'PostController')
      }).prefix('/v1')
      const postsIndex = Route.resolve('/v1/users/1/posts', 'GET')
      expect(postsIndex.name).to.equal('users.posts.index')
      expect(postsIndex.handler).to.equal('PostController.index')
    })

    it('should resolve routes registered as resource under a group and with a group', function () {
      Route.resource('users.posts', 'PostController')
      Route.group('v1', function () {
        Route.resource('users.posts', 'V1PostController')
      }).prefix('/v1')
      const V1postsIndex = Route.resolve('/v1/users/1/posts', 'GET')
      expect(V1postsIndex.name).to.equal('users.posts.index')
      expect(V1postsIndex.handler).to.equal('V1PostController.index')

      const postsIndex = Route.resolve('/users/1/posts', 'GET')
      expect(postsIndex.name).to.equal('users.posts.index')
      expect(postsIndex.handler).to.equal('PostController.index')
    })

    it('should be able to define and resolve routes using formats', function () {
      Route.get('/users', 'UsersController.index').formats(['json', 'xml'])
      const userIndex = Route.resolve('/users', 'GET')
      const withJson = Route.resolve('/users.json', 'GET')
      const withXml = Route.resolve('/users.xml', 'GET')
      expect(userIndex.handler).to.equal(withJson.handler)
      expect(userIndex.handler).to.equal(withXml.handler)
    })

    it('should be able to define and resolve routes using formats from groups', function () {
      Route.group('v2', function () {
        Route.get('/users', 'UsersController.index')
      }).prefix('/v2').formats(['json', 'xml'])
      const userIndex = Route.resolve('/v2/users', 'GET')
      const withJson = Route.resolve('/v2/users.json', 'GET')
      const withXml = Route.resolve('/v2/users.xml', 'GET')
      expect(userIndex.handler).to.equal(withJson.handler)
      expect(userIndex.handler).to.equal(withXml.handler)
    })

    it('should be able to define formats on single routes and then groups too', function () {
      Route.group('v2', function () {
        Route.get('/users', 'UsersController.index').formats(['html'])
      }).prefix('/v2').formats(['json', 'xml'])
      const userIndex = Route.resolve('/v2/users', 'GET')
      const withJson = Route.resolve('/v2/users.json', 'GET')
      const withXml = Route.resolve('/v2/users.xml', 'GET')
      const withHtml = Route.resolve('/v2/users.html', 'GET')
      expect(userIndex.handler).deep.equal(withJson.handler)
      expect(userIndex.handler).deep.equal(withXml.handler)
      expect(userIndex.handler).deep.equal(withHtml.handler)
    })

    it('should be to define able formats on route resources', function () {
      Route.resource('users', 'UsersController').formats(['json', 'html'])
      const userIndex = Route.resolve('/users', 'GET')
      const withJson = Route.resolve('/users.json', 'GET')
      const withHtml = Route.resolve('/users.html', 'GET')
      expect(userIndex.handler).deep.equal(withJson.handler)
      expect(userIndex.handler).deep.equal(withHtml.handler)
    })

    it('should return format as params when using formats', function () {
      Route.resource('users', 'UsersController').formats(['json', 'html'])
      const userIndex = Route.resolve('/users', 'GET')
      const withJson = Route.resolve('/users.json', 'GET')
      const withHtml = Route.resolve('/users.html', 'GET')
      expect(userIndex.params.format).to.equal(undefined)
      expect(withJson.params.format).to.equal('.json')
      expect(withHtml.params.format).to.equal('.html')
    })
  })

  context('Building Url', function () {
    it('should make url for any url , even if not registered inside routes', function () {
      const url = Route.url('http://amanvirk.me/:post', {post: 'hello-world'})
      expect(url).to.equal('http://amanvirk.me/hello-world')
    })

    it('should make for any given route', function () {
      Route.get('/:post', 'SomeController.index')
      const url = Route.url('/:post', {post: 'hello-world'})
      expect(url).to.equal('/hello-world')
    })

    it('should make url for a named route', function () {
      Route.get('/:post', 'SomeController.index').as('post')
      const url = Route.url('post', {post: 'hello-world'})
      expect(url).to.equal('/hello-world')
    })

    it('should make url for a prefixed named route', function () {
      Route.group('v1', function () {
        Route.get('/:post', 'SomeController.index').as('post')
      }).prefix('/v1')
      const url = Route.url('post', {post: 'hello-world'})
      expect(url).to.equal('/v1/hello-world')
    })

    it('should make url for route registered inside domain', function () {
      Route.group('v1', function () {
        Route.get('/:post', 'SomeController.index').as('post')
      }).domain('amanvirk.me')
      const url = Route.url('post', {post: 'hello-world'})
      expect(url).to.equal('amanvirk.me/hello-world')
    })

    it('should make url for route registered as a resource', function () {
      Route.resource('users', 'UsersController')
      const url = Route.url('users.index')
      const createUrl = Route.url('users.create')
      const updateUrl = Route.url('users.update', {id: 1})
      expect(url).to.equal('/users')
      expect(createUrl).to.equal('/users/create')
      expect(updateUrl).to.equal('/users/1')
    })

    it('should be able to define a get route using .on method', function () {
      Route.on('/signup')
      const routes = Route.routes()
      expect(routes[0].handler).to.equal(null)
      expect(routes[0].route).to.equal('/signup')
    })

    it('should bind a custom callback handler to the render method', function () {
      Route.on('/signup').render('signup')
      const routes = Route.routes()
      expect(typeof (routes[0].handler)).to.equal('function')
      expect(routes[0].route).to.equal('/signup')
    })

    it('should call sendView method on response when handler is invoked', function * () {
      let viewToRender = null
      const res = {
        sendView: function * (view) {
          viewToRender = view
        }
      }
      Route.on('/signup').render('signup')
      const routes = Route.routes()
      yield routes[0].handler({}, res)
      expect(viewToRender).to.equal('signup')
    })

    it('should pass request object to the sendView method', function * () {
      let requestPassed = null
      const res = {
        sendView: function * (view, data) {
          requestPassed = data.request
        }
      }
      Route.on('/signup').render('signup')
      const routes = Route.routes()
      yield routes[0].handler({foo: 'bar'}, res)
      expect(requestPassed).deep.equal({foo: 'bar'})
    })

    it('should be able to bind middleware to the resource', function () {
      Route.resource('tasks', 'TaskController').middleware('auth')
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))
      expect(routes).to.have.length(7)
      expect(verbs['/tasks-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/create-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks-POST']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/:id/edit-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-PUT/PATCH']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-DELETE']).deep.equal(['auth'])
    })

    it('should be able to bind middleware on selected actions', function () {
      Route.resource('tasks', 'TaskController').middleware({
        auth: ['store']
      })
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))
      expect(routes).to.have.length(7)
      expect(verbs['/tasks-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks/create-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks-POST']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks/:id/edit-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks/:id-PUT/PATCH']).deep.equal([])
      expect(verbs['/tasks/:id-DELETE']).deep.equal([])
    })

    it('should be able to bind multiple middleware on selected actions', function () {
      Route.resource('tasks', 'TaskController').middleware({
        auth: ['store'],
        web: ['index', 'show']
      })
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))
      expect(routes).to.have.length(7)
      expect(verbs['/tasks-GET/HEAD']).deep.equal(['web'])
      expect(verbs['/tasks/create-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks-POST']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-GET/HEAD']).deep.equal(['web'])
      expect(verbs['/tasks/:id/edit-GET/HEAD']).deep.equal([])
      expect(verbs['/tasks/:id-PUT/PATCH']).deep.equal([])
      expect(verbs['/tasks/:id-DELETE']).deep.equal([])
    })

    it('should throw an error when actions are not defined as array', function () {
      const fn = () => Route.resource('tasks', 'TaskController').middleware({auth: 'store'})
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_PARAMETER: Resource route methods must be defined as an array')
    })

    it('should be able to bind an array middleware to the resource', function () {
      Route.resource('tasks', 'TaskController').middleware(['auth'])
      const routes = Route.routes()
      const verbs = _.fromPairs(_.map(routes, function (route) {
        return [route.route + '-' + route.verb.join('/'), route.middlewares]
      }))
      expect(routes).to.have.length(7)
      expect(verbs['/tasks-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/create-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks-POST']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/:id/edit-GET/HEAD']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-PUT/PATCH']).deep.equal(['auth'])
      expect(verbs['/tasks/:id-DELETE']).deep.equal(['auth'])
    })

    it('should return an array of routes for a given resource', function () {
      const resourceRoutes = Route
        .resource('tasks', 'TaskController')
        .only(['store', 'update'])
        .middleware(['auth'])
        .toJSON()
      expect(resourceRoutes).to.have.length(2)
      expect(resourceRoutes[0].route).to.equal('/tasks')
      expect(resourceRoutes[1].route).to.equal('/tasks/:id')
      expect(resourceRoutes[0].middlewares).deep.equal(['auth'])
      expect(resourceRoutes[1].middlewares).deep.equal(['auth'])
    })
  })
})
