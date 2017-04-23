'use strict'

<<<<<<< e39969bb7dec35fa2eebea8052287fd590b7af4a
/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const Config = require('../../src/Config')
const chai = require('chai')
const path = require('path')
const expect = chai.expect
const Helpers = {
  configPath: function () {
    return path.join(__dirname, '/config')
  }
}

describe('Config', function () {
  it('should ignore any files apart from .js files inside the config directory', function () {
    const config = new Config(Helpers)
    expect(config.config).not.have.property('.gitkeep')
    expect(config.config).to.have.property('database')
  })

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
=======
/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')
const configPath = path.join(__dirname, './config')

const Config = require('../../src/Config')

test.group('Config', () => {
  test('ignore any files apart from .js files inside the config directory', (assert) => {
    const config = new Config(configPath)
    assert.notProperty(config._config, '.gitkeep')
    assert.property(config._config, 'database')
  })

  test('get value for a given key from config store', (assert) => {
    const config = new Config(configPath)
    const host = config.get('database.mysql.connection.host')
    assert.equal(host, 'localhost')
  })

  test('return default value when actual value does not exists', (assert) => {
    const config = new Config(configPath)
    const database = config.get('database.mysql.connection.database', 'adonis')
    assert.equal(database, 'adonis')
  })

  test('return actual value when it\'s falsy', (assert) => {
    const config = new Config(configPath)
    const connection = config.get('database.connection', true)
    assert.equal(connection, false)
  })

  test('return undefined when default value is not defined', (assert) => {
    const config = new Config(configPath)
    const database = config.get('database.mysql.connection.database')
    assert.equal(database, undefined)
  })

  test('return resolved value when defined as reference', (assert) => {
    const config = new Config(configPath)
    const database = config.get('database.mysqlProduction')
    assert.equal(database.client, 'mysql')
  })

  test('set value for a given key', (assert) => {
    const config = new Config(configPath)
    config.set('database.mysql.connection.database', 'blog')
    const database = config.get('database.mysql.connection.database')
    assert.equal(database, 'blog')
  })

  test('should set mid level paths via key', (assert) => {
    const config = new Config(configPath)
>>>>>>> feat(*): initiate re-write
    config.set('database.mysql', {
      connection: {
        host: '127.0.0.1'
      }
    })
    const host = config.get('database.mysql.connection.host')
<<<<<<< e39969bb7dec35fa2eebea8052287fd590b7af4a
    expect(host).to.equal('127.0.0.1')
  })

  it('should return booleans as booleans', function () {
    const config = new Config(Helpers)
    config.set('database.mysql.debug', true)
    const debug = config.get('database.mysql.debug')
    expect(debug).to.equal(true)
=======
    assert.equal(host, '127.0.0.1')
  })

  test('should return booleans as booleans', (assert) => {
    const config = new Config(configPath)
    config.set('database.mysql.debug', true)
    const debug = config.get('database.mysql.debug')
    assert.equal(debug, true)
>>>>>>> feat(*): initiate re-write
  })
})
