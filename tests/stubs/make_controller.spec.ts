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

test.group('Make controller', () => {
  test('prepare controller stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()

    const stub = await stubs.build('make/controller/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('user'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/controllers/users_controller.ts'))
    assert.match(contents, /export default class UsersController {/)
    assert.match(contents, new RegExp("// import type { HttpContext } from '@adonisjs/core/http'"))
  })

  test('prepare resourceful controller stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()

    const stub = await stubs.build('make/controller/resource.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('user'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/controllers/users_controller.ts'))
    assert.match(contents, /export default class UsersController {/)
    assert.match(contents, new RegExp("import type { HttpContext } from '@adonisjs/core/http'"))
    assert.match(contents, new RegExp('async index\\({}: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async create\\({}: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async store\\({ request }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async show\\({ params }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async edit\\({ params }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async update\\({ params, request }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async destroy\\({ params }: HttpContext\\) {}'))
  })

  test('prepare resourceful api controller stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()

    const stub = await stubs.build('make/controller/api.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('user'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/controllers/users_controller.ts'))
    assert.match(contents, /export default class UsersController {/)
    assert.match(contents, new RegExp("import type { HttpContext } from '@adonisjs/core/http'"))
    assert.match(contents, new RegExp('async index\\({}: HttpContext\\) {}'))
    assert.notMatch(contents, new RegExp('async create\\({}: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async store\\({ request }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async show\\({ params }: HttpContext\\) {}'))
    assert.notMatch(contents, new RegExp('async edit\\({ params }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async update\\({ params, request }: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async destroy\\({ params }: HttpContext\\) {}'))
  })

  test('prepare actions controller stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()

    const stub = await stubs.build('make/controller/actions.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('user'),
      actions: ['index', 'show', 'deleteProfile'],
    })

    assert.equal(destination, join(BASE_PATH, 'app/controllers/users_controller.ts'))
    assert.match(contents, /export default class UsersController {/)
    assert.match(contents, new RegExp("import type { HttpContext } from '@adonisjs/core/http'"))
    assert.match(contents, new RegExp('async index\\({}: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async show\\({}: HttpContext\\) {}'))
    assert.match(contents, new RegExp('async deleteProfile\\({}: HttpContext\\) {}'))
  })
})
