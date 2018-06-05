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
const { ioc } = require('@adonisjs/fold')
const { Config } = require('@adonisjs/sink')

const BcryptDriver = require('../../src/Hash/Drivers').bcrypt
const ArgonDriver = require('../../src/Hash/Drivers').argon
const Hash = require('../../src/Hash')
const HashManager = require('../../src/Hash/Manager')
const HashFacade = require('../../src/Hash/Facade')
const HashMock = require('../../src/Hash/Mock')

test.group('Hash | Bcrypt Driver', (group) => {
  test('hash value', async (assert) => {
    const Hash = new BcryptDriver()
    const hashed = await Hash.make('foo')
    assert.isDefined(hashed)
  })

  test('return true when hash matches', async (assert) => {
    const Hash = new BcryptDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('foo', hashed)
    assert.isTrue(verified)
  })

  test('return false when hash does not match', async (assert) => {
    const Hash = new BcryptDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('bar', hashed)
    assert.isFalse(verified)
  })

  test('return false instead of throwing exception', async (assert) => {
    const Hash = new BcryptDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify(undefined, hashed)
    assert.isFalse(verified)
  })
})

test.group('Hash | Argon Driver', (group) => {
  test('hash value', async (assert) => {
    const Hash = new ArgonDriver()
    const hashed = await Hash.make('foo')
    assert.isDefined(hashed)
  })

  test('return true when hash matches', async (assert) => {
    const Hash = new ArgonDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('foo', hashed)
    assert.isTrue(verified)
  })

  test('return false when hash does not match', async (assert) => {
    const Hash = new ArgonDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify('bar', hashed)
    assert.isFalse(verified)
  })

  test('return false instead of throwing exception', async (assert) => {
    const Hash = new ArgonDriver()

    const hashed = await Hash.make('foo')
    const verified = await Hash.verify(undefined, hashed)
    assert.isFalse(verified)
  })
})

test.group('Hash | Fake', () => {
  test('return string as it is from mock', async (assert) => {
    const hashed = await HashMock.make('foo')
    assert.equal(hashed, 'foo')
  })

  test('return false when strings aren\'t equal', async (assert) => {
    const verified = await HashMock.verify('foo', 'bar')
    assert.isFalse(verified)
  })

  test('return true when strings are equal', async (assert) => {
    const verified = await HashMock.verify('foo', 'foo')
    assert.isTrue(verified)
  })
})

test.group('Hash | Instance', () => {
  test('hash password using defined driver', async (assert) => {
    const Bcrypt = new BcryptDriver()
    const hash = new Hash(Bcrypt)

    const hashed = await hash.make('foo')

    assert.isDefined(hashed)
  })

  test('verify hash using defined driver', async (assert) => {
    const Bcrypt = new BcryptDriver()
    const hash = new Hash(Bcrypt)

    const hashed = await hash.make('foo')
    const verified = await hash.verify('foo', hashed)

    assert.isTrue(verified)
  })
})

test.group('Hash | Manager', (group) => {
  group.before(() => {
    ioc.fake('Adonis/Src/Config', () => new Config())
  })

  test('extend hasher by adding drivers', (assert) => {
    const myDriver = {}
    HashManager.extend('myDriver', myDriver)
    assert.deepEqual(HashManager._drivers, { myDriver })
  })

  test('throw error when trying to access invalid driver', (assert) => {
    const fn = () => HashManager.driver('foo')
    assert.throw(fn, 'E_INVALID_HASHER_DRIVER: Hash driver foo does not exists')
  })

  test('return driver instance for a given driver', (assert) => {
    const bcryptDriver = HashManager.driver('bcrypt')
    assert.instanceOf(bcryptDriver, BcryptDriver)
  })
})

test.group('Hash | Facade', (group) => {
  group.before(() => {
    ioc.fake('Adonis/Src/Config', () => new Config())
  })

  test('return hasher instance with selected driver', (assert) => {
    const config = new Config()
    config.set('hash', {
      driver: 'bcrypt',
      bcrypt: {}
    })

    const hasher = new HashFacade(config)
    assert.instanceOf(hasher.driver('bcrypt'), Hash)
    assert.instanceOf(hasher.driver('bcrypt').driver, BcryptDriver)
  })

  test('return hasher instance with extended driver', (assert) => {
    const myDriver = {
      make () {},
      setConfig () {}
    }

    HashManager.extend('mydriver', myDriver)

    const config = new Config()
    config.set('hash', {
      driver: 'mydriver',
      mydriver: {}
    })

    const hasher = new HashFacade(config)
    assert.instanceOf(hasher.driver('mydriver'), Hash)
    assert.deepEqual(hasher.driver('mydriver').driver, myDriver)
  })

  test('create singleton hasher instances', (assert) => {
    const config = new Config()
    config.set('hash', {
      driver: 'bcrypt',
      bcrypt: {},
      anotherFile: {}
    })

    const hasher = new HashFacade(config)
    hasher.driver('bcrypt')
    assert.lengthOf(Object.keys(hasher._hasherInstances), 1)
    hasher.driver('bcrypt')
    assert.lengthOf(Object.keys(hasher._hasherInstances), 1)
  })

  test('create different instance when hasher is different', (assert) => {
    const config = new Config()
    config.set('hash', {
      driver: 'bcrypt',
      bcrypt: {},
      argon: {}
    })

    const hasher = new HashFacade(config)
    hasher.driver('bcrypt')
    assert.lengthOf(Object.keys(hasher._hasherInstances), 1)
    hasher.driver('argon')
    assert.lengthOf(Object.keys(hasher._hasherInstances), 2)
  })

  test('proxy hasher instance methods', async (assert) => {
    const config = new Config()
    config.set('hash', {
      driver: 'bcrypt',
      bcrypt: {
        round: 10
      }
    })

    const hasher = new HashFacade(config)
    const hashed = await hasher.make('foo')
    assert.isDefined(hashed)
  })

  test('use bcrypt when no driver is defined', async (assert) => {
    const config = new Config()
    config.set('hash', {
    })

    const hasher = new HashFacade(config)
    const hashed = await hasher.make('foo')
    assert.isDefined(hashed)
  })
})
