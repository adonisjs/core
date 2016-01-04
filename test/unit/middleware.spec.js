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

describe('Middleware', function () {

  Ioc.autoload('App',path.join(__dirname,'./app'))

  afterEach(function () {
    Middleware.new()
  })

  it('should register a global middleware', function () {
    Middleware.register('App/Foo/Bar')
    const global = Middleware.getGlobal()
    expect(global[0]).to.equal('App/Foo/Bar')
  })

  it('should register a named middleware', function () {
    Middleware.register('bar','App/Foo/Bar')
    const named = Middleware.getNamed()
    expect(named.bar).to.equal('App/Foo/Bar')
  })

  it('should bulk register global middleware', function () {
    Middleware.global(['App/Foo/Bar','App/Foo/Baz'])
    const global = Middleware.getGlobal()
    expect(global).deep.equal(['App/Foo/Bar','App/Foo/Baz'])
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

  it('should filter requested named middleware', function () {
    Middleware.register('bar','App/Foo/Bar')
    Middleware.register('baz','App/Foo/Baz')
    expect(Middleware.filter(['baz'])).deep.equal(['App/Foo/Baz'])
  })

  it('should filter requested named middleware and attach all global middleware to it', function () {
    Middleware.register('bar','App/Foo/Bar')
    Middleware.register('App/Foo/Global')
    Middleware.register('baz','App/Foo/Baz')
    expect(Middleware.filter(['baz'], true)).deep.equal(['App/Foo/Global','App/Foo/Baz'])
  })

  it('should resolve middlware instances from Ioc container', function () {
    Middleware.register('App/Http/Middleware/Auth')
    const resolved = Middleware.resolve(Middleware.filter([],true))
    expect(resolved).to.be.an('array')
    expect(resolved[0].method).to.equal('handle')
  })

  it('should call an array of middleware till last one', function * () {
    Middleware.register('App/Http/Middleware/Auth')
    Middleware.register('App/Http/Middleware/Cycle2')
    const resolved = Middleware.resolve(Middleware.filter([],true))
    const request = {count:0}
    const response = {}

    const composed = Middleware.compose(resolved, request, response)
    yield composed()
    expect(request.count).to.equal(2)
  })

  it('should abort middlware cycle when yield next has not been called', function * () {
    Middleware.register('App/Http/Middleware/Cycle')
    Middleware.register('App/Http/Middleware/Cycle2')
    const resolved = Middleware.resolve(Middleware.filter([],true))
    const request = {count:0}
    const response = {}

    const composed = Middleware.compose(resolved, request, response)
    yield composed()
    expect(request.count).to.equal(1)
  })

})
