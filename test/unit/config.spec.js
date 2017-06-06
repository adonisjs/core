'use strict'

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
    config.set('database.mysql', {
      connection: {
        host: '127.0.0.1'
      }
    })
    const host = config.get('database.mysql.connection.host')
    assert.equal(host, '127.0.0.1')
  })

  test('should return booleans as booleans', (assert) => {
    const config = new Config(configPath)
    config.set('database.mysql.debug', true)
    const debug = config.get('database.mysql.debug')
    assert.equal(debug, true)
  })

  test('merge values with the defaults', (assert) => {
    const config = new Config(configPath)

    const database = config.merge('database.sqlite', {
      connection: {
        filename: 'dev.sqlite3'
      }
    })

    assert.deepEqual(database, {
      client: 'sqlite',
      connection: {
        filename: 'dev.sqlite3'
      }
    })
  })

  test('ignore error when config directory does not exists', (assert) => {
    /* eslint no-new: "off" */
    new Config(path.join(__dirname, '../foo/config'))
  })
})
