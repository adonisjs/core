'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Ioc = require('adonis-fold').Ioc
const path = require('path')
const Middleware = require('../../src/Middleware')
const NE = require('node-exceptions')
require('co-mocha')

describe('Middleware', function () {
  afterEach(function () {
    Middleware.new()
    Ioc.new()
    Ioc.autoload('App', path.join(__dirname, './app'))
  })

  it('should register a global middleware', function () {
    Middleware.register('App/Foo/Bar')
    const global = Middleware.getGlobal()
    expect(global[0]).to.equal('App/Foo/Bar')
  })

  it('should register a named middleware', function () {
    Middleware.register('bar', 'App/Foo/Bar')
    const named = Middleware.getNamed()
    expect(named.bar).to.equal('App/Foo/Bar')
  })

  it('should bulk register global middleware', function () {
    Middleware.global(['App/Foo/Bar', 'App/Foo/Baz'])
    const global = Middleware.getGlobal()
    expect(global).deep.equal(['App/Foo/Bar', 'App/Foo/Baz'])
  })

  it('should bulk register a named middleware', function () {
    const namedMiddleware = {
      'bar': 'App/Foo/Bar',
      'baz': 'App/Foo/Baz'
    }
    Middleware.named(namedMiddleware)
    const named = Middleware.getNamed()
    expect(named).deep.equal(namedMiddleware)
  })

  it('should fetch parameters from named middleware', function () {
    expect(Middleware.fetchParams('basic')).deep.equal(['basic'])
  })

  it('should fetch parameters from multiple named middleware', function () {
    expect(Middleware.fetchParams('basic,false')).deep.equal(['basic', 'false'])
  })

  it('should resolve all global middleware using resolve method', function () {
    Middleware.global(['App/Http/Middleware/Global'])
    const resolved = Middleware.resolve({}, true)
    expect(resolved).to.be.an('array')
    expect(resolved.length).to.equal(1)
    expect(resolved[0]).to.have.property('instance')
    expect(resolved[0]).to.have.property('method')
    expect(resolved[0]).to.have.property('parameters')
  })

  it('should format named middleware keys to namespace params mappings', function () {
    Middleware.register('auth', 'App/Http/Middleware/AuthMiddleware')
    const formatted = Middleware.formatNamedMiddleware(['auth:basic'])
    expect(formatted).to.deep.equal({'App/Http/Middleware/AuthMiddleware': ['basic']})
  })

  it('should throw error when unable to find mapping inside middleware store', function () {
    const formatted = function () {
      return Middleware.formatNamedMiddleware(['auth:basic'])
    }
    expect(formatted).to.throw(NE.RuntimeException, /auth is not register/)
  })

  it('should resolve named middleware using resolve method', function () {
    Middleware.register('auth', 'App/Http/Middleware/AuthMiddleware')
    const formatted = Middleware.formatNamedMiddleware(['auth:basic'])
    const resolved = Middleware.resolve(formatted, false)
    expect(resolved.length).to.equal(1)
    expect(resolved[0]).to.have.property('instance')
    expect(resolved[0]).to.have.property('method')
    expect(resolved[0]).to.have.property('parameters')
    expect(resolved[0].parameters).deep.equal(['basic'])
  })

  it('should resolve global and named named middleware using resolve method', function () {
    Middleware.register('auth', 'App/Http/Middleware/AuthMiddleware')
    Middleware.global(['App/Http/Middleware/Global'])
    const formatted = Middleware.formatNamedMiddleware(['auth:basic'])
    const resolved = Middleware.resolve(formatted, true)
    expect(resolved.length).to.equal(2)
    expect(resolved[0]).to.have.property('instance')
    expect(resolved[0]).to.have.property('method')
    expect(resolved[0]).to.have.property('parameters')
    expect(resolved[0].parameters).deep.equal([])
    expect(resolved[1]).to.have.property('instance')
    expect(resolved[1]).to.have.property('method')
    expect(resolved[1]).to.have.property('parameters')
    expect(resolved[1].parameters).deep.equal(['basic'])
  })

  it('should compose global middleware using compose method', function * () {
    Middleware.global(['App/Http/Middleware/Global'])
    const request = {}
    const response = {}
    const resolved = Middleware.resolve([], true)
    const compose = Middleware.compose(resolved, request, response)
    yield compose()
    expect(request.count).to.equal(2)
  })

  it('should abort request in between when middleware throws an error', function * () {
    Middleware.global(['App/Http/Middleware/GlobalThrow', 'App/Http/Middleware/Parser'])
    const request = {}
    const response = {}
    const resolved = Middleware.resolve([], true)
    const compose = Middleware.compose(resolved, request, response)
    try {
      yield compose()
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.message).to.equal('Login')
      expect(request.count).to.equal(undefined)
    }
  })

  it('should call middleware one by one', function * () {
    Middleware.global(['App/Http/Middleware/Parser', 'App/Http/Middleware/Cycle2'])
    const request = {}
    const response = {}
    const resolved = Middleware.resolve([], true)
    const compose = Middleware.compose(resolved, request, response)
    yield compose()
    expect(request.count).to.equal(1)
  })

  it('should pass parameters to be middleware', function * () {
    Middleware.global(['App/Http/Middleware/Parser', 'App/Http/Middleware/Cycle2'])
    Middleware.register('auth', 'App/Http/Middleware/AuthMiddleware')
    const request = {}
    const response = {}
    const formatted = Middleware.formatNamedMiddleware(['auth:basic'])
    const resolved = Middleware.resolve(formatted, true)
    const compose = Middleware.compose(resolved, request, response)
    yield compose()
    expect(request.count).to.equal(1)
    expect(request.scheme).to.equal('basic')
  })
})
