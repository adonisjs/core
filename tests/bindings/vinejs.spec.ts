/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import vine from '@vinejs/vine'
import { test } from '@japa/runner'

import { IgnitorFactory } from '../../factories/core/ignitor.ts'
import { MultipartFileFactory } from '../../factories/bodyparser.ts'

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
})
