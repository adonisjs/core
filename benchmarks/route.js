'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

const Benchmark = require('benchmark')
const suite = new Benchmark().Suite
const Route = require('../src/Route')

function registerPlainRoute () {
  Route.get('/about', function * () {})
  Route.get('/home', function * () {})
  Route.get('/contact', function * () {})
  Route.get('/user/:id', function * () {})
  Route.new()
}

function chainRoutes () {
  Route.get('/about', function * () {}).as('about').middleware('auth:basic')
  Route.get('/home', function * () {}).as('home').middleware('auth:basic')
  Route.get('/contact', function * () {}).as('contact').middleware('auth:basic')
  Route.get('/user/:id', function * () {}).as('profle').middleware('auth:basic')
  Route.new()
}

function registerResource () {
  Route.resource('user', 'UserController')
  Route.new()
}

function registerResourceWithCollections () {
  Route
    .resource('user', 'UserController')
    .addCollection('active', ['GET'], function (collection) {
      collection.bindAction('UserController.getActiveUsers')
    })
    .addMember('settings', ['GET'], function (collection) {
      collection.bindAction('UserController.getSettings')
    })
  Route.new()
}

function routesWithGroups () {
  Route.group('admin', function () {
    Route.get('/profile', function * () {})
    Route.get('/settings', function * () {})
    Route.get('/accounts', function * () {})
  }).prefix('/admin')
  Route.new()
}

function routesResourceWithGroups () {
  Route.group('admin', function () {
    Route.resource('user', 'UserController')
  }).prefix('/admin')
  Route.new()
}

function resolveRoute () {
  Route.resolve('/about', 'GET', 'localhost')
}

function resgisterRoutesForResolve () {
  Route.get('/about', function * () {})
  Route.get('/home', function * () {})
  Route.get('/contact', function * () {})
  Route.get('/user/:id', function * () {})
  Route.resource('users', 'UserController')
}

suite
.add('registerPlainRoute', registerPlainRoute)
.add('chainRoutes', chainRoutes)
.add('routesWithGroups', routesWithGroups)
.add('routesResourceWithGroups', routesResourceWithGroups)
.add('registerResource', registerResource)
.add('registerResourceWithCollections', registerResourceWithCollections)
.add('resolveRoute', resolveRoute)
.on('cycle', (event) => {
  if (event.target.name === 'registerResourceWithCollections') {
    resgisterRoutesForResolve()
  }
  console.log(String(event.target))
})
.run()
