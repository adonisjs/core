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
import { remove, outputFile } from 'fs-extra'

import { Env } from '../src/Env'

const APP_ROOT = join(__dirname, 'app')

test.group('Env', (group) => {
  group.afterEach(async () => {
    delete process.env.ENV_SILENT
    delete process.env.APP_USERNAME
    delete process.env.loadDb
    delete process.env.ENV_PATH
    delete process.env.NODE_ENV

    await remove(APP_ROOT)
  })

  test('load .env file from the project root and raise exception when missing', (assert) => {
    const env = () => new Env(APP_ROOT)
    assert.throw(env, 'E_MISSING_ENV_FILE: The .env file is missing')
  })

  test('do not raise exception when ENV_SILENT is true', (assert) => {
    process.env.ENV_SILENT = 'true'
    const env = () => new Env(APP_ROOT)
    assert.doesNotThrow(env)
  })

  test('parse .env file and set values inside process.env', async (assert) => {
    await outputFile(join(APP_ROOT, '.env'), `APP_USERNAME = virk`)

    const env = new Env(APP_ROOT)
    assert.equal(env.get('APP_USERNAME'), 'virk')
  })

  test('do not overwrite existing process.env values', async (assert) => {
    process.env.APP_USERNAME = 'virk'
    await outputFile(join(APP_ROOT, '.env'), `APP_USERNAME = nikk`)

    const env = new Env(APP_ROOT)
    assert.equal(env.get('APP_USERNAME'), 'virk')
  })

  test('cast string true to boolean true', async (assert) => {
    process.env.loadDb = 'true'
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    assert.isTrue(env.get('loadDb'))
  })

  test('cast null string to null', async (assert) => {
    process.env.loadDb = 'null'
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    assert.isNull(env.get('loadDb'))
  })

  test('return undefined when value is missing', async (assert) => {
    process.env.ENV_SILENT = 'true'
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    assert.isUndefined(env.get('loadDb'))
  })

  test('raise error when using getOrFail and value is undefined', async (assert) => {
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    const fn = () => env.getOrFail('loadDb')
    assert.throw(fn, 'E_MISSING_ENV_KEY: Make sure to define environment variable loadDb')
  })

  test('raise error when using getOrFail and value is not existy', async (assert) => {
    process.env.loadDb = 'null'
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    const fn = () => env.getOrFail('loadDb')
    assert.throw(fn, 'E_MISSING_ENV_KEY: Make sure to define environment variable loadDb')
  })

  test('do not raise error when using getOrFail and value is false', async (assert) => {
    process.env.loadDb = 'false'
    process.env.ENV_SILENT = 'true'

    const env = new Env(APP_ROOT)
    assert.isFalse(env.getOrFail('loadDb'))
  })

  test('load .env file from a different location', async (assert) => {
    await outputFile(join(APP_ROOT, '.secrets'), `APP_USERNAME = virk`)
    process.env.ENV_PATH = '.secrets'

    const env = new Env(APP_ROOT)
    assert.equal(env.getOrFail('APP_USERNAME'), 'virk')
  })

  test('load .env file from a different absolute location', async (assert) => {
    const secretsFile = join(APP_ROOT, '.secrets')
    await outputFile(secretsFile, `APP_USERNAME = nikk`)
    process.env.ENV_PATH = secretsFile

    const env = new Env(APP_ROOT)
    assert.equal(env.getOrFail('APP_USERNAME'), 'nikk')
  })

  test('load .env.testing file and overwrite existing .env variables', async (assert) => {
    await outputFile(join(APP_ROOT, '.env'), `APP_USERNAME = nikk`)
    await outputFile(join(APP_ROOT, '.env.testing'), `APP_USERNAME = virk`)
    process.env.NODE_ENV = 'testing'

    const env = new Env(APP_ROOT)
    assert.equal(env.getOrFail('APP_USERNAME'), 'virk')
  })

  test('update value inside process.env', async (assert) => {
    await outputFile(join(APP_ROOT, '.env'), { loadDb: true })

    const env = new Env(APP_ROOT)
    env.set('loadDb', 'false')
    assert.isFalse(env.get('loadDb'))
  })
})
