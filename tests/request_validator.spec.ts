/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { FieldContext } from '@vinejs/vine/types'
import vine, { SimpleErrorReporter, SimpleMessagesProvider } from '@vinejs/vine'

import { RequestValidator } from '../modules/http/main.js'
import { IgnitorFactory } from '../factories/core/ignitor.js'
import { TestUtilsFactory } from '../factories/core/test_utils.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Request validator', () => {
  test('perform validation on request data using request validator', async ({ assert }) => {
    assert.plan(1)

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
      })
    )

    ctx.request.__raw_files = {}

    try {
      await ctx.request.validateUsing(validator)
    } catch (error) {
      assert.deepEqual(error.messages, [
        {
          field: 'username',
          message: 'The username field must be defined',
          rule: 'required',
        },
      ])
    }
  })

  test('pass validation when data is valid', async ({ assert, expectTypeOf }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
      })
    )

    ctx.request.__raw_files = {}
    ctx.request.setInitialBody({ username: 'virk' })

    const output = await ctx.request.validateUsing(validator)
    assert.deepEqual(output, { username: 'virk' })
    expectTypeOf(output).toEqualTypeOf<{ username: string }>()
  })

  test('define inline data', async ({ assert, expectTypeOf }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
      })
    )

    ctx.request.__raw_files = {}

    const output = await ctx.request.validateUsing(validator, { data: { username: 'virk' } })
    assert.deepEqual(output, { username: 'virk' })
    expectTypeOf(output).toEqualTypeOf<{ username: string }>()
  })

  test('validate headers', async ({ assert, expectTypeOf }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
        headers: vine.object({
          accept: vine.string(),
        }),
      })
    )

    ctx.request.request.headers['accept'] = 'json'
    ctx.request.__raw_files = {}
    ctx.request.setInitialBody({ username: 'virk' })

    const output = await ctx.request.validateUsing(validator)
    assert.deepEqual(output, { username: 'virk', headers: { accept: 'json' } })
    expectTypeOf(output).toEqualTypeOf<{ username: string; headers: { accept: string } }>()
  })

  test('pass metadata to validator', async ({ assert }) => {
    assert.plan(1)

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.withMetaData<{ disallowUserNames: string[] }>().compile(
      vine.object({
        username: vine.string().notIn((field) => {
          return field.meta.disallowUserNames
        }),
      })
    )

    ctx.request.__raw_files = {}
    ctx.request.setInitialBody({ username: 'virk' })

    try {
      await ctx.request.validateUsing(validator, {
        meta: { disallowUserNames: ['virk'] },
      })
    } catch (error) {
      assert.containsSubset(error.messages, [
        {
          field: 'username',
          message: 'The selected username is invalid',
          rule: 'notIn',
        },
      ])
    }
  })

  test('use custom messages provider', async ({ assert, cleanup }) => {
    assert.plan(1)

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
      })
    )

    ctx.request.__raw_files = {}
    RequestValidator.messagesProvider = () =>
      new SimpleMessagesProvider(
        {
          required: 'The value is missing',
        },
        {}
      )
    cleanup(() => {
      RequestValidator.messagesProvider = undefined
    })

    try {
      await ctx.request.validateUsing(validator)
    } catch (error) {
      assert.deepEqual(error.messages, [
        {
          field: 'username',
          message: 'The value is missing',
          rule: 'required',
        },
      ])
    }
  })

  test('use custom error reporter', async ({ assert, cleanup }) => {
    assert.plan(1)

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../providers/app_provider.js'),
            () => import('../providers/vinejs_provider.js'),
          ],
        },
      })
      .create(BASE_URL)

    const testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()

    const ctx = await testUtils.createHttpContext()
    const validator = vine.compile(
      vine.object({
        username: vine.string(),
      })
    )

    ctx.request.__raw_files = {}
    class MyErrorReporter extends SimpleErrorReporter {
      report(
        message: string,
        rule: string,
        field: FieldContext,
        meta?: Record<string, any> | undefined
      ): void {
        return super.report(message, `validations.${rule}`, field, meta)
      }
    }

    RequestValidator.errorReporter = () => {
      return new MyErrorReporter()
    }
    cleanup(() => {
      RequestValidator.errorReporter = undefined
    })

    try {
      await ctx.request.validateUsing(validator)
    } catch (error) {
      assert.deepEqual(error.messages, [
        {
          field: 'username',
          message: 'The username field must be defined',
          rule: 'validations.required',
        },
      ])
    }
  })
})
