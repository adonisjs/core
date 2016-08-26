'use strict'

/* global describe, it*/
/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Registrar = require('../../').Registrar
const Ioc = require('../../').Ioc
const path = require('path')

describe('Registrar', function () {
  it('should register an array of providers to ioc container', function (done) {
    Registrar
      .register([path.join(__dirname, './app/providers/FooProvider')])
      .then(function () {
        expect(Ioc.use('Providers/Foo').foo).to.equal('bar')
        done()
      }).catch(done)
  })

  it('should only bind unique providers', function (done) {
    Registrar
      .register([path.join(__dirname, './app/providers/FooProvider'), path.join(__dirname, './app/providers/FooProvider')])
      .then(function () {
        expect(Ioc.use('Providers/Foo').foo).to.equal('bar')
        done()
      }).catch(done)
  })

  it('should call boot method on provider when defined after register method', function (done) {
    Registrar
      .register([path.join(__dirname, './app/providers/FooProvider'), path.join(__dirname, './app/providers/BarProvider')])
      .then(function () {
        expect(Ioc.use('Providers/Bar').bar).deep.equal({foo: 'bar'})
        expect(Ioc.use('Providers/Bar').boot).to.equal(true)
        done()
      }).catch(done)
  })

  it('should emit register and boot events when all providers are registered', function (done) {
    let providersRegistered = false
    let providersBooted = false
    Ioc.on('providers:registered', function () {
      providersRegistered = true
    })
    Ioc.on('providers:booted', function () {
      providersBooted = true
    })
    Registrar
      .register([path.join(__dirname, './app/providers/FooProvider'), path.join(__dirname, './app/providers/BarProvider')])
      .then(function () {
        expect(providersBooted).to.equal(true)
        expect(providersRegistered).to.equal(true)
        done()
      }).catch(done)
  })
})
