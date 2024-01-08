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

test.group('Make event', () => {
  test('prepare event stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/event/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('userRegistered'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/events/user_registered.ts'))
    assert.match(contents, new RegExp('export default class UserRegistered extends BaseEvent {'))
    assert.match(contents, new RegExp("import { BaseEvent } from '@adonisjs/core/events'"))
    assert.match(contents, new RegExp('constructor\\(\\) {'))
  })
})
