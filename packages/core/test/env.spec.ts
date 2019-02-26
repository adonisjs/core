/**
 * @adonisjs/framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { join } from 'path'
import { Filesystem } from '@adonisjs/dev-utils'

import { Env } from '../src/Env'

const fs = new Filesystem()

test.group('Env', (group) => {
  group.afterEach(async () => {
    delete process.env.ENV_SILENT
    delete process.env.loadDb
    delete process.env.ENV_PATH
    await fs.cleanup()
  })

  test('load .env file from the project root and raise exception when missing', (assert) => {
    const env = () => new Env(fs.basePath)
    assert.throw(env, 'E_MISSING_ENV_FILE: The .env file is missing')
  })

  test('do not raise exception when ENV_SILENT is true', (assert) => {
    process.env.ENV_SILENT = 'true'
    const env = () => new Env(fs.basePath)
    assert.doesNotThrow(env)
  })

  test('parse .env file and set values inside process.env', async (assert) => {
    await fs.addEnv('.env', { APP_USERNAME: 'virk' })

    const env = new Env(fs.basePath)
    assert.equal(env.get('APP_USERNAME'), 'virk')
  })

  test('do not overwrite existing process.env values', async (assert) => {
    process.env.APP_USERNAME = 'virk'
    await fs.addEnv('.env', { APP_USERNAME: 'virk' })

    const env = new Env(fs.basePath)
    assert.equal(env.get('APP_USERNAME'), 'virk')
  })

  test('cast string true to boolean true', async (assert) => {
    await fs.addEnv('.env', { loadDb: 'true' })

    const env = new Env(fs.basePath)
    assert.isTrue(env.get('loadDb'))
  })

  test('cast null string to null', async (assert) => {
    await fs.addEnv('.env', { loadDb: 'null' })

    const env = new Env(fs.basePath)
    assert.isNull(env.get('loadDb'))
  })

  test('return undefined when value is missing', async (assert) => {
    await fs.addEnv('.env', {})

    const env = new Env(fs.basePath)
    assert.isUndefined(env.get('loadDb'))
  })

  test('raise error when using getOrFail and value is undefined', async (assert) => {
    await fs.addEnv('.env', {})

    const env = new Env(fs.basePath)
    const fn = () => env.getOrFail('loadDb')
    assert.throw(fn, 'E_MISSING_ENV_KEY: Make sure to define environment variable loadDb')
  })

  test('raise error when using getOrFail and value is not existy', async (assert) => {
    await fs.addEnv('.env', { loadDb: 'null' })

    const env = new Env(fs.basePath)
    const fn = () => env.getOrFail('loadDb')
    assert.throw(fn, 'E_MISSING_ENV_KEY: Make sure to define environment variable loadDb')
  })

  test('do not raise error when using getOrFail and value is false', async (assert) => {
    await fs.addEnv('.env', { loadDb: 'false' })

    const env = new Env(fs.basePath)
    assert.isFalse(env.getOrFail('loadDb'))
  })

  test('load .env file from a different location', async (assert) => {
    await fs.addEnv('.secrets', { APP_USERNAME: 'virk' })
    process.env.ENV_PATH = '.secrets'

    const env = new Env(fs.basePath)
    assert.equal(env.getOrFail('APP_USERNAME'), 'virk')
  })

  test('load .env file from a different absolute location', async (assert) => {
    await fs.addEnv('.secrets', { APP_USERNAME: 'nikk' })
    process.env.ENV_PATH = join(fs.basePath, '.secrets')

    const env = new Env(fs.basePath)
    assert.equal(env.getOrFail('APP_USERNAME'), 'nikk')
  })

  test('load .env.testing file and overwrite existing .env variables', async (assert) => {
    await fs.addEnv('.env', { APP_USERNAME: 'nikk' })
    await fs.addEnv('.env.testing', { APP_USERNAME: 'virk' })
    process.env.NODE_ENV = 'testing'

    const env = new Env(fs.basePath)
    assert.equal(env.getOrFail('APP_USERNAME'), 'virk')
  })

  test('update value inside process.env', async (assert) => {
    await fs.addEnv('.env', { loadDb: true })

    const env = new Env(fs.basePath)
    env.set('loadDb', 'false')
    assert.isFalse(env.get('loadDb'))
  })
})
