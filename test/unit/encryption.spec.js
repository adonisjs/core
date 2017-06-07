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
const { Config } = require('@adonisjs/sink')
const _ = require('lodash')

const Encryption = require('../../src/Encryption')

const getAppKey = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return _.map(_.range(0, 18), (num) => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

test.group('Encryption', () => {
  test('throw exception app key is missing', (assert) => {
    const fn = () => new Encryption(new Config())
    assert.throw(fn, 'E_MISSING_APP_KEY: Make sure to define appKey inside config/app.js file before using Encryption provider')
  })

  test('throw exception when key is smaller than 16 digits', (assert) => {
    const config = new Config()
    config.set('app.appKey', 'foo')
    const fn = () => new Encryption(config)
    assert.throw(fn, 'key must be at least 16 characters long')
  })

  test('encrypt string using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    assert.isDefined(encryption.encrypt('hello world'))
  })

  test('encrypt object using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    assert.isDefined(encryption.encrypt({name: 'virk'}))
  })

  test('encrypt boolean using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    assert.isDefined(encryption.encrypt(true))
  })

  test('encrypt number using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    assert.isDefined(encryption.encrypt(20))
  })

  test('encrypt date using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    assert.isDefined(encryption.encrypt(new Date()))
  })

  test('decrypt string using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encryptedValue = encryption.encrypt('hello world')
    assert.equal(encryption.decrypt(encryptedValue), 'hello world')
  })

  test('decrypt object using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encryptedValue = encryption.encrypt({name: 'virk'})
    assert.deepEqual(encryption.decrypt(encryptedValue), {name: 'virk'})
  })

  test('decrypt boolean using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encryptedValue = encryption.encrypt(true)
    assert.equal(encryption.decrypt(encryptedValue), true)
  })

  test('decrypt number using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encryptedValue = encryption.encrypt(20)
    assert.equal(encryption.decrypt(encryptedValue), 20)
  })

  test('decrypt date using valid key', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const date = new Date().toString()
    const encryptedValue = encryption.encrypt(date)
    assert.deepEqual(encryption.decrypt(encryptedValue), date)
  })

  test('base64 encode a string', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encodedValue = encryption.base64Encode('hello world')
    assert.isDefined(encodedValue)
  })

  test('base64 decode a string', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const encodedValue = encryption.base64Encode('hello world')
    assert.equal(encryption.base64Decode(encodedValue), 'hello world')
  })

  test('base64 decode a buffer', (assert) => {
    const config = new Config()
    config.set('app.appKey', getAppKey())
    const encryption = new Encryption(config)
    const buff = Buffer.from('hello world')
    assert.equal(encryption.base64Decode(buff), 'hello world')
  })
})
