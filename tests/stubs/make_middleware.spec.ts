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

test.group('Make middleware', () => {
  test('prepare middleware stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/middleware/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('auth'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/middleware/auth_middleware.ts'))
    assert.match(contents, new RegExp('export default class AuthMiddleware {'))
    assert.match(contents, new RegExp("import type { HttpContext } from '@adonisjs/core/http'"))
    assert.match(contents, new RegExp("import type { NextFn } from '@adonisjs/core/types/http'"))
    assert.match(contents, new RegExp('export default class AuthMiddleware {'))
    assert.match(contents, new RegExp('async handle\\(ctx: HttpContext, next: NextFn\\) {'))
  })
})
