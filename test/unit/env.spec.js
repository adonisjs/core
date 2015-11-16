'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const Env = require('../../src/Env')
const chai = require('chai')
const expect = chai.expect

const Helpers = {
  basePath: function () {
    return __dirname + '/app'
  }
}

describe('Env', function() {
  it('should load .env file by initiating Env class', function () {
    new Env(Helpers)
  })

  it('should get values defined in .env file', function () {
    const env = new Env(Helpers)
    expect(env.get('APP_PORT')).to.equal('3000')
  })

  it('should return default value when it does exists in .env file', function () {
    const env = new Env(Helpers)
    expect(env.get('APP_KEY','foo')).to.equal('foo')
  })

  it('should override defined values', function () {
    const env = new Env(Helpers)
    env.set('APP_PORT', 4000)
    expect(env.get('APP_PORT')).to.equal('4000')
  })

  it('should convert boolean strings into a valid boolean', function () {
    const env = new Env(Helpers)
    env.set('CACHE_VIEWS',false)
    expect(env.get('CACHE_VIEWS')).to.equal(false)
  })

  it('should convert 0 and 1 to true and false', function () {
    const env = new Env(Helpers)
    env.set('CACHE_VIEWS',0)
    expect(env.get('CACHE_VIEWS')).to.equal(false)
  })

  it('should convert true defined as string to a boolean', function () {
    const env = new Env(Helpers)
    env.set('CACHE_VIEWS',true)
    expect(env.get('CACHE_VIEWS')).to.equal(true)
  })
});
