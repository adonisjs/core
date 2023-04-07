/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { HashDriverContract } from '../types/hash.js'
import { IgnitorFactory } from '../factories/core/ignitor.js'
import {
  Hash,
  Argon,
  Bcrypt,
  Scrypt,
  HashManager,
  driversList,
  defineConfig,
} from '../modules/hash/main.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Hash', () => {
  test('process hash config and make it work with hash manager', async ({
    assert,
    expectTypeOf,
  }) => {
    const config = defineConfig({
      list: {
        scrypt: {
          driver: 'scrypt',
        },
      },
    })

    driversList.extend('scrypt', (scryptConfig) => new Scrypt(scryptConfig))

    const hash = new HashManager(config)
    assert.instanceOf(hash.use('scrypt'), Hash)
    expectTypeOf(hash.use).parameters.toMatchTypeOf<['scrypt'?]>()
  })

  test('raise error when list is not defined', async ({ assert }) => {
    // @ts-expect-error
    assert.throws(() => defineConfig({}), 'Missing "list" property in hash config')
  })

  test('raise error when default hasher is not defined in the list', async ({ assert }) => {
    assert.throws(
      () =>
        defineConfig({
          // @ts-expect-error
          default: 'scrypt',
          list: {},
        }),
      'Missing "list.scrypt" in hash config. It is referenced by the "default" property'
    )
  })

  test('create instance of pre-defined driver', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../providers/app_provider.js',
            '../providers/hash_provider.js',
            '../providers/http_provider.js',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.instanceOf(driversList.create('bcrypt', {}), Bcrypt)
    assert.instanceOf(driversList.create('scrypt', {}), Scrypt)
    assert.instanceOf(driversList.create('argon2', {}), Argon)
  })

  test('raise error when trying to create unknown hash driver', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../providers/app_provider.js',
            '../providers/hash_provider.js',
            '../providers/http_provider.js',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.throws(
      // @ts-expect-error
      () => driversList.create('foo', {}),
      'Unknown hash driver "foo". Make sure the driver is registered'
    )
  })

  test('add drivers to hash drivers collection', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            '../providers/app_provider.js',
            '../providers/hash_provider.js',
            '../providers/http_provider.js',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    class FakeHash implements HashDriverContract {
      async make(value: string) {
        return value
      }

      async verify(hashedValue: string, plainValue: string) {
        return hashedValue === plainValue
      }

      needsReHash(_: string) {
        return false
      }

      isValidHash(_: string) {
        return false
      }
    }

    // @ts-expect-error
    driversList.extend('fake', () => new FakeHash())

    // @ts-expect-error
    const fakeDriver = driversList.create('fake')
    assert.instanceOf(fakeDriver, FakeHash)
  })
})
