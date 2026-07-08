/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import vine from '@vinejs/vine'
import supertest from 'supertest'
import { test } from '@japa/runner'
import { createServer } from 'node:http'
import type { InferInput, Infer } from '@vinejs/vine/types'
import type { MultipartFile } from '@adonisjs/bodyparser/types'

import { IgnitorFactory } from '../../factories/core/ignitor.ts'
import { TestUtilsFactory } from '../../factories/core/test_utils.ts'
import { MultipartFileFactory, BodyParserMiddlewareFactory } from '../../factories/bodyparser.ts'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Bindings | VineJS', (group) => {
  group.setup(async () => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../../providers/app_provider.js'),
            () => import('../../providers/hash_provider.js'),
            () => import('../../providers/vinejs_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, {
        importer(filePath: string) {
          return import(new URL(filePath, new URL('../', import.meta.url)).href)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
  })

  test('clone schema type', async ({ assert }) => {
    const file = vine.file()
    assert.notStrictEqual(file, file.clone())
  })

  test('raise error when value is not a file', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine.file(),
      })
    )

    try {
      await validator.validate({
        avatar: 'foo',
      })
    } catch (error: any) {
      assert.deepEqual(error.messages, [
        {
          field: 'avatar',
          message: 'The avatar must be a file',
          rule: 'file',
        },
      ])
    }
  })

  test('raise error when file size is greater than the allowed size', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine.file({ size: '2mb' }),
      })
    )

    try {
      await validator.validate({
        avatar: new MultipartFileFactory()
          .merge({
            size: 4000000,
          })
          .create(),
      })
    } catch (error: any) {
      assert.deepEqual(error.messages, [
        {
          field: 'avatar',
          message: 'File size should be less than 2MB',
          rule: 'file.size',
          meta: {
            size: '2mb',
          },
        },
      ])
    }
  })

  test('raise error when file extension is not allowed', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine.file({ extnames: ['jpg'] }),
      })
    )

    try {
      await validator.validate({
        avatar: new MultipartFileFactory()
          .merge({
            size: 4000000,
            extname: 'png',
          })
          .create(),
      })
    } catch (error: any) {
      assert.deepEqual(error.messages, [
        {
          field: 'avatar',
          message: 'Invalid file extension png. Only jpg is allowed',
          rule: 'file.extname',
          meta: {
            extnames: ['jpg'],
          },
        },
      ])
    }
  })

  test('compute file options lazily', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine.file(() => {
          return { extnames: ['jpg'] }
        }),
      })
    )

    try {
      await validator.validate({
        avatar: new MultipartFileFactory()
          .merge({
            size: 4000000,
            extname: 'png',
          })
          .create(),
      })
    } catch (error: any) {
      assert.deepEqual(error.messages, [
        {
          field: 'avatar',
          message: 'Invalid file extension png. Only jpg is allowed',
          rule: 'file.extname',
          meta: {
            extnames: ['jpg'],
          },
        },
      ])
    }
  })

  test('pass validation when file is valid', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine.file(() => {
          return { extnames: ['jpg'] }
        }),
      })
    )

    const { avatar } = await validator.validate({
      avatar: new MultipartFileFactory()
        .merge({
          size: 4000000,
          extname: 'jpg',
        })
        .create(),
    })

    assert.equal(avatar.size, 4000000)
    assert.lengthOf(avatar.errors, 0)
  })

  test('pass validation when file is null and marked as nullable', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine
          .file(() => {
            return { extnames: ['jpg'] }
          })
          .nullable(),
      })
    )

    const payload = await validator.validate({
      avatar: null,
    })
    assert.isNull(payload.avatar)
  })

  test('pass validation when file is null and marked as optional', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine
          .file(() => {
            return { extnames: ['jpg'] }
          })
          .optional(),
      })
    )

    const payload = await validator.validate({
      avatar: null,
    })
    assert.isUndefined(payload.avatar)
  })

  test('pass validation when file is missing and marked as optional', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine
          .file(() => {
            return { extnames: ['jpg'] }
          })
          .optional(),
      })
    )

    const payload = await validator.validate({})
    assert.isUndefined(payload.avatar)
  })

  test('raise error when field is marked as nullable, but missing', async ({ assert }) => {
    const validator = vine.create(
      vine.object({
        avatar: vine
          .file(() => {
            return { extnames: ['jpg'] }
          })
          .nullable(),
      })
    )

    try {
      await validator.validate({})
    } catch (error: any) {
      assert.deepEqual(error.messages, [
        {
          field: 'avatar',
          message: 'The avatar field must be defined',
          rule: 'required',
        },
      ])
    }
  })

  test('infer File and Blob as valid input types for the file schema', ({ expectTypeOf }) => {
    const schema = vine.object({
      avatar: vine.file(),
    })

    /**
     * InferInput represents what the client is allowed to send. A browser
     * can only send a File or a Blob (via FormData), never a MultipartFile.
     */
    expectTypeOf<InferInput<typeof schema>['avatar']>().toEqualTypeOf<MultipartFile | File | Blob>()

    /**
     * Infer represents the validated value available on the server, which
     * is always a MultipartFile created by the BodyParser.
     */
    expectTypeOf<Infer<typeof schema>['avatar']>().toEqualTypeOf<MultipartFile>()
  })
})

test.group('Bindings | VineJS | multipart uploads over HTTP', (group) => {
  let testUtils: ReturnType<InstanceType<typeof TestUtilsFactory>['create']>

  group.each.setup(async () => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('../../providers/app_provider.js'),
            () => import('../../providers/hash_provider.js'),
            () => import('../../providers/vinejs_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .create(BASE_URL, {
        importer(filePath: string) {
          return import(new URL(filePath, new URL('../', import.meta.url)).href)
        },
      })

    testUtils = new TestUtilsFactory().create(ignitor)
    await testUtils.app.init()
    await testUtils.app.boot()
    await testUtils.boot()
  })

  test('convert File and Blob sent over HTTP into MultipartFile instances', async ({ assert }) => {
    const bodyParser = new BodyParserMiddlewareFactory().create()
    const validator = vine.create(
      vine.object({
        avatar: vine.file(),
        document: vine.file(),
      })
    )

    let validated: Infer<typeof validator> | undefined
    let serverError: any

    /**
     * The server parses the incoming multipart request using the BodyParser
     * middleware and then validates it using the "vine.file" schema. This
     * mirrors exactly what happens during a real request lifecycle.
     */
    const server = createServer(async (req, res) => {
      const ctx = await testUtils.createHttpContext({ req, res })
      try {
        await bodyParser.handle(ctx, async () => {
          validated = await validator.validate({
            avatar: ctx.request.file('avatar'),
            document: ctx.request.file('document'),
          })
        })
      } catch (error) {
        serverError = error
      }
      res.end('done')
    })

    /**
     * Sending a File and a Blob over the wire the same way a browser would.
     * A File carries a filename ("avatar.jpg"), whereas a Blob is sent without
     * one (defaulting to "blob"), yet BodyParser converts both to a MultipartFile.
     */
    await supertest(server)
      .post('/')
      .attach('avatar', Buffer.from('hello avatar'), 'avatar.jpg')
      .attach('document', Buffer.from('hello document'), 'blob')

    assert.isUndefined(serverError)
    assert.isDefined(validated)

    /**
     * The File uploaded under "avatar" is converted into a MultipartFile
     */
    assert.isTrue(validated!.avatar.isMultipartFile)
    assert.equal(validated!.avatar.fieldName, 'avatar')
    assert.equal(validated!.avatar.clientName, 'avatar.jpg')
    assert.equal(validated!.avatar.size, Buffer.byteLength('hello avatar'))
    assert.isTrue(validated!.avatar.isValid)

    /**
     * The Blob uploaded under "document" is also converted into a MultipartFile
     */
    assert.isTrue(validated!.document.isMultipartFile)
    assert.equal(validated!.document.fieldName, 'document')
    assert.equal(validated!.document.size, Buffer.byteLength('hello document'))
    assert.isTrue(validated!.document.isValid)
  })
})
