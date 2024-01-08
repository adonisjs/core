/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Ignitor } from '../../index.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Ignitor', () => {
  test('create app instance using the ignitor', async ({ assert }) => {
    const app = new Ignitor(BASE_URL).createApp('web')
    assert.equal(app.getState(), 'created')
  })

  test('tap into application instance using the tap method', async ({ assert }) => {
    assert.plan(2)

    const ignitor = new Ignitor(BASE_URL)
    ignitor.tap((app) => {
      assert.equal(app.getState(), 'created')
    })

    const app = ignitor.createApp('web')
    assert.equal(app.getState(), 'created')
  })
})
