/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Encryption } from '@adonisjs/encryption'
import { setTimeout } from 'node:timers/promises'

import type { ApplicationService } from '../../src/types.ts'
import { Legacy, legacy } from '../../modules/encryption/drivers/legacy.ts'
import { drivers, defineConfig } from '../../modules/encryption/define_config.ts'

const SECRET_KEY = 'averylongsecretkeythatshouldbe32'

test.group('Legacy | driver', () => {
  test('throw error when key is too short', ({ assert }) => {
    assert.throws(
      () => new Legacy({ key: 'short' }),
      'The value of your key should be at least 16 characters long'
    )
  })

  test('encrypt and decrypt a string value', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello world')
    const decrypted = encryption.decrypt<string>(encrypted)

    assert.equal(decrypted, 'hello world')
  })

  test('encrypt and decrypt an object', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const payload = { name: 'John', age: 30 }
    const encrypted = encryption.encrypt(payload)
    const decrypted = encryption.decrypt<typeof payload>(encrypted)

    assert.deepEqual(decrypted, payload)
  })

  test('encrypt and decrypt an array', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const payload = [1, 2, 3, 'four', { five: 5 }]
    const encrypted = encryption.encrypt(payload)
    const decrypted = encryption.decrypt<typeof payload>(encrypted)

    assert.deepEqual(decrypted, payload)
  })

  test('encrypt and decrypt a number', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt(42)
    const decrypted = encryption.decrypt<number>(encrypted)

    assert.equal(decrypted, 42)
  })

  test('encrypt and decrypt a boolean', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt(true)
    const decrypted = encryption.decrypt<boolean>(encrypted)

    assert.equal(decrypted, true)
  })

  test('generate different ciphertext for the same value (random IV)', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted1 = encryption.encrypt('hello')
    const encrypted2 = encryption.encrypt('hello')

    assert.notEqual(encrypted1, encrypted2)
  })

  test('return null when decrypting non-string value', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    // @ts-expect-error - testing invalid input
    const decrypted = encryption.decrypt(123)

    assert.isNull(decrypted)
  })

  test('return null when decrypting invalid format', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const decrypted = encryption.decrypt('invalid')

    assert.isNull(decrypted)
  })

  test('return null when ciphertext is tampered', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello')
    const [cipher, iv, hmac] = encrypted.split('.')
    const tampered = `${cipher}x.${iv}.${hmac}`

    const decrypted = encryption.decrypt(tampered)

    assert.isNull(decrypted)
  })

  test('return null when HMAC is tampered', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello')
    const [cipher, iv, hmac] = encrypted.split('.')
    const tampered = `${cipher}.${iv}.${hmac}x`

    const decrypted = encryption.decrypt(tampered)

    assert.isNull(decrypted)
  })

  test('return null when IV is tampered', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello')
    const [cipher, iv, hmac] = encrypted.split('.')
    const tampered = `${cipher}.${iv}x.${hmac}`

    const decrypted = encryption.decrypt(tampered)

    assert.isNull(decrypted)
  })
})

test.group('Legacy | purpose', () => {
  test('encrypt and decrypt with a purpose', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', undefined, 'login')
    const decrypted = encryption.decrypt<string>(encrypted, 'login')

    assert.equal(decrypted, 'hello')
  })

  test('return null when purpose does not match', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', undefined, 'login')
    const decrypted = encryption.decrypt(encrypted, 'different-purpose')

    assert.isNull(decrypted)
  })

  test('return null when decrypting without purpose but was encrypted with one', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', undefined, 'login')
    const decrypted = encryption.decrypt(encrypted)

    assert.isNull(decrypted)
  })

  test('return null when decrypting with purpose but was encrypted without one', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello')
    const decrypted = encryption.decrypt(encrypted, 'login')

    assert.isNull(decrypted)
  })
})

test.group('Legacy | expiration', () => {
  test('encrypt with expiration time', async ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', '100ms')
    const decrypted = encryption.decrypt<string>(encrypted)

    assert.equal(decrypted, 'hello')
  })

  test('return null when value has expired', async ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', '50ms')

    await setTimeout(100)

    const decrypted = encryption.decrypt(encrypted)

    assert.isNull(decrypted)
  })

  test('encrypt with expiration and purpose using options object', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    const encrypted = encryption.encrypt('hello', { expiresIn: '1h', purpose: 'login' })
    const decrypted = encryption.decrypt<string>(encrypted, 'login')

    assert.equal(decrypted, 'hello')
  })
})

test.group('Legacy | factory', () => {
  test('legacy factory creates driver correctly', ({ assert }) => {
    const config = legacy({ keys: [SECRET_KEY] })

    assert.isFunction(config.driver)
    assert.deepEqual(config.keys, [SECRET_KEY])

    const driver = config.driver(SECRET_KEY)
    assert.instanceOf(driver, Legacy)
  })

  test('filter empty keys', async ({ assert }) => {
    const provider = drivers.legacy({
      keys: [SECRET_KEY, '', undefined as any, null as any, SECRET_KEY],
    })

    const config = await provider.resolver({} as ApplicationService)

    assert.deepEqual(config.keys, [SECRET_KEY, SECRET_KEY])
  })
})

test.group('Legacy | backward compatibility', () => {
  /**
   * old encrypter -> Legacy driver
   */
  test('Legacy decrypts a value encrypted by the old AdonisJS v6 encrypter', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const decrypted = encryption.decrypt<string>(oldEncryptor.encrypt('test'))
    assert.equal(decrypted, 'test')
  })

  test('Legacy decrypts non-string values encrypted by the old encrypter', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const payload = { name: 'John', roles: ['admin', 'user'], age: 30, active: true }
    const decrypted = encryption.decrypt<typeof payload>(oldEncryptor.encrypt(payload))
    assert.deepEqual(decrypted, payload)
  })

  test('Legacy decrypts a value encrypted by the old encrypter with a purpose', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const encryptedByOldSystem = oldEncryptor.encrypt('test', undefined, 'blabla')

    const decrypted = encryption.decrypt<string>(encryptedByOldSystem, 'blabla')
    assert.equal(decrypted, 'test')

    const decryptedNoPurpose = encryption.decrypt(encryptedByOldSystem)
    assert.isNull(decryptedNoPurpose)

    const decryptedWrongPurpose = encryption.decrypt(encryptedByOldSystem, 'wrong')
    assert.isNull(decryptedWrongPurpose)
  })

  /**
   * Legacy driver -> old encrypter (the drop-in replacement guarantee)
   */
  test('old AdonisJS v6 encrypter decrypts a value encrypted by the Legacy driver', ({
    assert,
  }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const decrypted = oldEncryptor.decrypt<string>(encryption.encrypt('test'))
    assert.equal(decrypted, 'test')
  })

  test('old encrypter decrypts non-string values encrypted by the Legacy driver', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const payload = { name: 'John', roles: ['admin', 'user'], age: 30, active: true }
    const decrypted = oldEncryptor.decrypt<typeof payload>(encryption.encrypt(payload))
    assert.deepEqual(decrypted, payload)
  })

  test('old encrypter decrypts a value encrypted by the Legacy driver with a purpose', ({
    assert,
  }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const encryptedByLegacy = encryption.encrypt('test', undefined, 'blabla')

    assert.equal(oldEncryptor.decrypt<string>(encryptedByLegacy, 'blabla'), 'test')
    assert.isNull(oldEncryptor.decrypt(encryptedByLegacy))
    assert.isNull(oldEncryptor.decrypt(encryptedByLegacy, 'wrong'))
  })

  /**
   * The IV must be encoded the exact same way by both implementations: a
   * random 16-character string whose base64url form decodes back to 16
   * bytes. This is the property that makes the two encoders interchangeable.
   */
  test('Legacy driver encodes the IV in the same format as the old encrypter', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })
    const oldEncryptor = new Encryption({ secret: SECRET_KEY })

    const decodeIv = (token: string) => {
      const ivEncoded = token.split('.')[1]
      return Buffer.from(
        ivEncoded
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(ivEncoded.length / 4) * 4, '='),
        'base64'
      )
    }

    const legacyIv = decodeIv(encryption.encrypt('test'))
    const oldIv = decodeIv(oldEncryptor.encrypt('test'))

    assert.lengthOf(legacyIv, 16)
    assert.lengthOf(oldIv, 16)

    /**
     * Both IVs must be ASCII-safe so they survive the old encrypter's
     * utf-8 round-trip during decryption.
     */
    assert.equal(legacyIv.toString('utf8'), legacyIv.toString('latin1'))
    assert.equal(oldIv.toString('utf8'), oldIv.toString('latin1'))
  })
})

test.group('Legacy | defineConfig', () => {
  test('defineConfig with legacy driver', async ({ assert }) => {
    const configProvider = defineConfig({
      default: 'legacy',
      list: {
        legacy: drivers.legacy({
          keys: [SECRET_KEY],
        }),
      },
    })

    const config = await configProvider.resolver({} as ApplicationService)

    assert.isDefined(config.list.legacy)
    assert.isFunction(config.list.legacy.driver)
    assert.deepEqual(config.list.legacy.keys, [SECRET_KEY])
  })
})

test.group('Legacy | blind indexes', () => {
  test('throw when computing blind index', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    assert.throws(
      () => encryption.blindIndex('foo@example.com', 'users.email'),
      'Blind indexes are not supported by the "legacy" encryption driver'
    )
  })

  test('throw when computing blind indexes', ({ assert }) => {
    const encryption = new Legacy({ key: SECRET_KEY })

    assert.throws(
      () => encryption.blindIndexes('foo@example.com', 'users.email'),
      'Blind indexes are not supported by the "legacy" encryption driver'
    )
  })
})
