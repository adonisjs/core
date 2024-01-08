/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { Argon } from '../modules/hash/drivers/argon.js'
import type { ApplicationService } from '../src/types.js'
import { Bcrypt } from '../modules/hash/drivers/bcrypt.js'
import { drivers } from '../modules/hash/define_config.js'
import { Scrypt } from '../modules/hash/drivers/scrypt.js'
import { IgnitorFactory } from '../factories/core/ignitor.js'
import { Hash, HashManager, defineConfig } from '../modules/hash/main.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Hash | drivers', () => {
  test('define driver provider', async ({ assert, expectTypeOf }) => {
    const scryptProvider = drivers.scrypt({})
    const scryptFactory = await scryptProvider.resolver({} as ApplicationService)

    assert.isFunction(scryptFactory)
    assert.instanceOf(scryptFactory(), Scrypt)
    expectTypeOf(scryptFactory).returns.toMatchTypeOf<Scrypt>()

    const bcryptProvider = drivers.bcrypt({})
    const bcryptFactory = await bcryptProvider.resolver({} as ApplicationService)

    assert.isFunction(bcryptFactory)
    assert.instanceOf(bcryptFactory(), Bcrypt)
    expectTypeOf(bcryptFactory).returns.toMatchTypeOf<Bcrypt>()

    const argonProvider = drivers.argon2({})
    const argonFactory = await argonProvider.resolver({} as ApplicationService)

    assert.isFunction(argonFactory)
    assert.instanceOf(argonFactory(), Argon)
    expectTypeOf(argonFactory).returns.toMatchTypeOf<Argon>()
  })
})

test.group('Hash | defineConfig', () => {
  test('defineConfig to lazily register hash drivers', async ({ assert, expectTypeOf }) => {
    const configProvider = defineConfig({
      list: {
        scrypt: drivers.scrypt({}),
      },
    })

    const config = await configProvider.resolver({} as ApplicationService)
    expectTypeOf(config).toMatchTypeOf<{
      default?: 'scrypt'
      list: {
        scrypt: () => Scrypt
      }
    }>()

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
})

test.group('Hash | provider', () => {
  test('create instance of drivers registered in config file', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        config: {
          hash: defineConfig({
            default: 'bcrypt',
            list: {
              bcrypt: drivers.bcrypt({}),
            },
          }),
        },
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/hash_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const hash = await app.container.make('hash')

    assert.instanceOf(hash.use('bcrypt'), Hash)
    assert.throws(() => hash.use('scrypt'), 'driverFactory is not a function')
    assert.throws(() => hash.use('argon2'), 'driverFactory is not a function')
  })
})
