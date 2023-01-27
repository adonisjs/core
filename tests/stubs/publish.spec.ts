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

import { stubsRoot } from '../../stubs/index.js'

const BASE_URL = new URL('./tmp/', import.meta.url)
const BASE_PATH = fileURLToPath(BASE_URL)

test.group('Publish', () => {
  test('prepare config stubs for publishing', async ({ assert }) => {
    const app = new AppFactory().create(BASE_URL, () => {})
    await app.init()

    const appConfig = await app.stubs.build('config/app.stub', {
      source: stubsRoot,
    })
    const { destination: appConfigDestination } = await appConfig.prepare({})
    assert.equal(appConfigDestination, join(BASE_PATH, 'config', 'app.ts'))

    const bodyparserConfig = await app.stubs.build('config/bodyparser.stub', {
      source: stubsRoot,
    })
    const { destination: bodyparserConfigDestination } = await bodyparserConfig.prepare({})
    assert.equal(bodyparserConfigDestination, join(BASE_PATH, 'config', 'bodyparser.ts'))

    const hashConfig = await app.stubs.build('config/hash.stub', {
      source: stubsRoot,
    })
    const { destination: hashConfigDestination } = await hashConfig.prepare({})
    assert.equal(hashConfigDestination, join(BASE_PATH, 'config', 'hash.ts'))

    const loggerConfig = await app.stubs.build('config/logger.stub', {
      source: stubsRoot,
    })
    const { destination: loggerConfigDestination } = await loggerConfig.prepare({})
    assert.equal(loggerConfigDestination, join(BASE_PATH, 'config', 'logger.ts'))
  })
})
