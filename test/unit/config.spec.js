'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Config = require('../../src/Config')
const chai = require('chai')
const expect = chai.expect
const Helpers = {
  configPath: function () {
    return __dirname + '/config'
  }
}

describe('Config', function() {
  it('should get values for a given key from config store', function () {
    const config = new Config(Helpers)
    const host = config.get('database.mysql.connection.host')
    expect(host).to.equal('localhost')
  })

  it('should return default value when actual value does not exists', function () {
    const config = new Config(Helpers)
    const database = config.get('database.mysql.connection.database', 'adonis')
    expect(database).to.equal('adonis')
  })

  it('should return null when default value is not defined', function () {
    const config = new Config(Helpers)
    const database = config.get('database.mysql.connection.database')
    expect(database).to.equal(null)
  })

  it('should return actual value when value is a false boolean', function () {
    const config = new Config(Helpers)
    const database = config.get('database.connection')
    expect(database).to.equal(false)
  })

  it('should return default value when default value is a false boolean', function () {
    const config = new Config(Helpers)
    const database = config.get('database.foo', false)
    expect(database).to.equal(false)
  })

  it('should set value for a given key', function () {
    const config = new Config(Helpers)
    config.set('database.mysql.connection.database', 'blog')
    const database = config.get('database.mysql.connection.database')
    expect(database).to.equal('blog')
  })

  it('should set mid level paths via key', function () {
    const config = new Config(Helpers)
    config.set('database.mysql', {
      connection : {
        host: '127.0.0.1'
      }
    })
    const host = config.get('database.mysql.connection.host')
    expect(host).to.equal('127.0.0.1')
  })

  it('should return booleans as booleans', function () {
    const config = new Config(Helpers)
    config.set('database.mysql.debug', true)
    const debug = config.get('database.mysql.debug')
    expect(debug).to.equal(true)
  })


});
