'use strict'

const chai = require('chai')
const path = require('path')
const test = require('japa')
const assert = chai.assert
const Registrar = require('../../src/Registrar')
const Ioc = require('../../src/Ioc')

test.group('Registrar', function () {
  test('should throw an exception when an array of paths are not provided to the register method', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    registrar
    .register(path.join(__dirname, './app/providers/FooProvider'))
    .then(() => {
      done(new Error('Expect test to fail but passed instead'))
    })
    .catch((error) => {
      assert.equal(error.message, 'E_INVALID_PARAMETER: register expects an array of providers to be registered')
      done()
    })
  })

  test('should be able to register an array of modules', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    registrar
    .register([path.join(__dirname, './app/providers/FooProvider')])
    .then(() => {
      assert.property(ioc.getBindings(), 'App/Foo')
      done()
    })
    .catch(done)
  })

  test('should throw an exception if class is not extended by service provider', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    registrar
    .register([path.join(__dirname, './app/providers/InvalidProvider')])
    .then(() => {
      done(new Error('Expect test to fail but passed instead'))
    })
    .catch((error) => {
      assert.equal(error.message, 'E_INVALID_SERVICE_PROVIDER: InvalidProvider must extend base service provider class')
      done()
    })
  })

  test('should throw an exception if class is not extended by service provider', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    registrar
    .register([path.join(__dirname, './app/providers/InvalidProvider')])
    .then(() => {
      done(new Error('Expect test to fail but passed instead'))
    })
    .catch((error) => {
      assert.equal(error.message, 'E_INVALID_SERVICE_PROVIDER: InvalidProvider must extend base service provider class')
      done()
    })
  })

  test('should call the boot method only when all providers have been registered', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    registrar
    .register([
      path.join(__dirname, './app/providers/FooProvider'),
      path.join(__dirname, './app/providers/BarProvider')]
    )
    .then(() => {
      assert.equal(ioc.use('App/Bar'), 'foo')
      done()
    })
    .catch(done)
  })

  test('should emit providers lifecycle events', function (done) {
    const ioc = new Ioc()
    const registrar = new Registrar(ioc)
    let providersRegistered = false
    let providersBooted = false

    registrar.on('providers:registered', () => {
      providersRegistered = true
    })

    registrar.on('providers:registered', () => {
      providersBooted = true
    })

    registrar
    .register([
      path.join(__dirname, './app/providers/FooProvider'),
      path.join(__dirname, './app/providers/BarProvider')]
    )
    .then(() => {
      assert.equal(providersRegistered, true)
      assert.equal(providersBooted, true)
      done()
    })
    .catch(done)
  })
})
