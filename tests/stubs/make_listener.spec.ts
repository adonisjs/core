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

test.group('Make listener', () => {
  test('prepare listener stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/listener/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('sendEmail'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/listeners/send_email.ts'))
    assert.match(contents, new RegExp('export default class SendEmail {'))
  })

  test('prepare listener stub for an event', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/listener/for_event.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('sendEmail'),
      event: app.generators.createEntity('users/user_registered'),
    })

    assert.equal(destination, join(BASE_PATH, 'app/listeners/send_email.ts'))
    assert.match(contents, new RegExp('export default class SendEmail {'))
    assert.match(
      contents,
      new RegExp("import type UserRegistered from '#events/users/user_registered.ts'")
    )
    assert.match(contents, new RegExp('async handle\\(event: UserRegistered\\) {'))
  })
})
