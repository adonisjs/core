/* global describe, it, before */

'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Namespace = require('../../src/Namespace/index')
const Ioc = require('adonis-fold').Ioc
const chai = require('chai')
const expect = chai.expect
const path = require('path')

let Helpers = {
  appPath: function () {
    return path.join(__dirname, './namespace/app')
  },
  appNameSpace: function () {
    return 'App'
  }
}

describe('Namespace', function () {
  before(function (done) {
    Ioc.clear()
    done()
  })

  it('should register app namespace and autoload directory with Ioc container', function () {
    let Env = {
      get: function () {
        return false
      }
    }

    let namespace = new Namespace(Env, Helpers)
    namespace.autoload()
    expect(Ioc.use('App/text')).to.equal('text')
  })
})
