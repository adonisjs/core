/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { AppFactory } from '@adonisjs/application/factories'

import { stubsRoot } from '../../stubs/main.js'

const BASE_URL = new URL('./tmp/', import.meta.url)
const BASE_PATH = fileURLToPath(BASE_URL)

test.group('Make validator', () => {
  test('prepare validator stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/validator/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('posts'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/validators/post.ts'))
    assert.match(contents, new RegExp("import vine from '@vinejs/vine'"))
  })

  test('prepare validator stub for a resource', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/validator/resource.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('posts'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/validators/post.ts'))
    assert.match(contents, new RegExp("import vine from '@vinejs/vine'"))
    assert.includeMembers(contents.split('\n'), [
      `export const createPostValidator = vine.compile(`,
      `  vine.object({})`,
      `)`,
      `export const updatePostValidator = vine.compile(`,
      `  vine.object({})`,
      `)`,
    ])
  })
})
