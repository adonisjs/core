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

test.group('Make provider', () => {
  test('prepare provider stub', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL)
    await app.init()

    const stubs = await app.stubs.create()
    const stub = await stubs.build('make/provider/main.stub', {
      source: stubsRoot,
    })
    const { contents, destination } = await stub.prepare({
      entity: app.generators.createEntity('app'),
    })

    assert.equal(destination, join(BASE_PATH, 'providers/app_provider.ts'))
    assert.match(contents, new RegExp('export default class AppProvider {'))
    assert.match(
      contents,
      new RegExp("import type { ApplicationService } from '@adonisjs/core/types'")
    )
    assert.match(contents, new RegExp('constructor\\(protected app: ApplicationService\\) {}'))
    assert.match(contents, new RegExp('register\\(\\)'))
    assert.match(contents, new RegExp('async boot\\(\\)'))
    assert.match(contents, new RegExp('async ready\\(\\)'))
    assert.match(contents, new RegExp('async start\\(\\)'))
    assert.match(contents, new RegExp('async shutdown\\(\\)'))
  })
})
