'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Env = require('../../src/Env')
const stderr = require('test-console').stderr
const path = require('path')
const chai = require('chai')
const expect = chai.expect

class Event {
  static fire () {}
}

const Helpers = {
  basePath: function () {
    return path.join(__dirname, './app')
  }
}

describe('Env', function () {
  it('should load .env file by initiating Env class', function () {
    /* eslint-disable no-new */
    new Env(Helpers, Event)
  })

  it('should load .env file from the location defined as ENV_PATH flag', function () {
    const inspect = stderr.inspect()
    process.env.ENV_PATH = '/users/.env'
    /* eslint-disable no-new */
    new Env(Helpers, Event)
    inspect.restore()
    expect(inspect.output[0]).to.match(/\/users\/\.env/)
    process.env.ENV_PATH = ''
  })

  it('should not inherit path from the basePath when ENV_PATH location has absolute path', function () {
    const inspect = stderr.inspect()
    process.env.ENV_PATH = '/.env'
    /* eslint-disable no-new */
    new Env(Helpers, Event)
    inspect.restore()
    expect(inspect.output[0]).to.match(/\.env/)
    process.env.ENV_PATH = ''
  })

  it('should get values defined in .env file', function () {
    const env = new Env(Helpers, Event)
    expect(env.get('APP_PORT')).to.equal('3000')
  })

  it('should return default value when it does exists in .env file', function () {
    const env = new Env(Helpers, Event)
    expect(env.get('APP_KEY', 'foo')).to.equal('foo')
  })

  it('should return default value when it does exists in .env file and default value is a boolean', function () {
    const env = new Env(Helpers, Event)
    expect(env.get('APP_KEY', false)).to.equal(false)
  })

  it('should override defined values', function () {
    const env = new Env(Helpers, Event)
    env.set('APP_PORT', 4000)
    expect(env.get('APP_PORT')).to.equal('4000')
  })

  it('should convert boolean strings into a valid boolean', function () {
    const env = new Env(Helpers, Event)
    env.set('CACHE_VIEWS', false)
    expect(env.get('CACHE_VIEWS')).to.equal(false)
  })

  it('should convert 0 and 1 to true and false', function () {
    const env = new Env(Helpers, Event)
    env.set('CACHE_VIEWS', 0)
    expect(env.get('CACHE_VIEWS')).to.equal(false)
  })

  it('should convert true defined as string to a boolean', function () {
    const env = new Env(Helpers, Event)
    env.set('CACHE_VIEWS', true)
    expect(env.get('CACHE_VIEWS')).to.equal(true)
  })
})
