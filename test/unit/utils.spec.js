'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const ServerHelpers = require('../../src/Server/helpers')
const Helpers = require('../../src/Helpers')
const path = require('path')
const chai = require('chai')
const expect = chai.expect

describe('Utils', function () {
  it('should parse controller method string', function () {
    Helpers.load(path.join(__dirname, './namespace/package.json'))

    let parsed = ServerHelpers.namespaceToControllerInstance('HomeController.index')
    expect(parsed).to.be.an('object')
    expect(parsed).to.have.property('controller')
    expect(parsed).to.have.property('action')
    expect(parsed.action).to.equal('index')
    expect(parsed.controller).to.equal('App/Http/Controllers/HomeController')

  })

  it('should parse pre namespaced controller method string', function () {
    let parsed = ServerHelpers.namespaceToControllerInstance('App/Http/Controllers/HomeController.index')
    expect(parsed).to.be.an('object')
    expect(parsed).to.have.property('controller')
    expect(parsed).to.have.property('action')
    expect(parsed.action).to.equal('index')
    expect(parsed.controller).to.equal('App/Http/Controllers/HomeController')

  })

  it('should parse nested controller with dot convention', function () {
    let parsed = ServerHelpers.namespaceToControllerInstance('User/HomeController.index')
    expect(parsed).to.be.an('object')
    expect(parsed).to.have.property('controller')
    expect(parsed).to.have.property('action')
    expect(parsed.action).to.equal('index')
    expect(parsed.controller).to.equal('App/Http/Controllers/User/HomeController')

  })

})
