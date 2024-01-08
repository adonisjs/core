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

test.group('Make test', () => {
  test('prepare test stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/test/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('users/send_email'),
      suite: {
        directory: 'tests/functional',
      },
    })

    assert.equal(destination, join(BASE_PATH, 'tests/functional/users/send_email.spec.ts'))
    assert.match(contents, new RegExp(`import { test } from '@japa/runner'`))
    assert.match(contents, new RegExp(`test\\.group\\('Users send email'`))
  })
})
