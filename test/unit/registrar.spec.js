'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const chai = require('chai')
const expect = chai.expect
const Registrar = require('../../').Registrar
const Ioc    = require('../../').Ioc
const path = require('path')

describe('Registrar', function () {

  it('should register an array of providers to ioc container', function (done) {

    Registrar
    .register([path.join(__dirname,'./app/providers/FooProvider')])
    .then (function () {
      expect(Ioc.use('Providers/Foo').foo).to.equal('bar')
      done()
    }).catch(done)

  })

})
