/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { join } from 'path'
import { remove, outputFile } from 'fs-extra'

import { requireAll } from '../src/requireAll'
const BASE_PATH = join(__dirname, 'app')

test.group('require all', (group) => {
  group.afterEach(async () => {
    await remove(BASE_PATH)
  })

  test('require .js, .ts and .json files from the disk', async (assert) => {
    await outputFile(join(BASE_PATH, 'app.ts'), `export default {
      loaded: true
    }`)

    await outputFile(join(BASE_PATH, 'server.ts'), `export const loaded = true`)
    await outputFile(join(BASE_PATH, 'config.js'), `module.exports = { loaded: true }`)
    await outputFile(join(BASE_PATH, 'main.json'), `{ "loaded": true }`)

    const output = requireAll(BASE_PATH)
    assert.deepEqual(output, {
      app: { loaded: true },
      server: { loaded: true },
      config: { loaded: true },
      main: { loaded: true },
    })
  })

  test('require files recursively', async (assert) => {
    await outputFile(join(BASE_PATH, 'ts/app.ts'), `export default {
      loaded: true
    }`)

    await outputFile(join(BASE_PATH, 'ts/server.ts'), `export const loaded = true`)
    await outputFile(join(BASE_PATH, 'js/config.js'), `module.exports = { loaded: true }`)
    await outputFile(join(BASE_PATH, 'json/main.json'), `{ "loaded": true }`)

    const output = requireAll(BASE_PATH)
    assert.deepEqual(output, {
      ts: {
        app: { loaded: true },
        server: { loaded: true },
      },
      js: {
        config: { loaded: true },
      },
      json: {
        main: { loaded: true },
      },
    })
  })

  test('do not require recursively when disabled', async (assert) => {
    await outputFile(join(BASE_PATH, 'ts/app.ts'), `export default {
      loaded: true
    }`)

    await outputFile(join(BASE_PATH, 'ts/server.ts'), `export const loaded = true`)
    await outputFile(join(BASE_PATH, 'js/config.js'), `module.exports = { loaded: true }`)
    await outputFile(join(BASE_PATH, 'json/main.json'), `{ "loaded": true }`)

    const output = requireAll(BASE_PATH, false)
    assert.deepEqual(output, {})
  })

  test('ignore .d.ts files', async (assert) => {
    await outputFile(join(BASE_PATH, 'ts/app.ts'), `export default {
      loaded: true
    }`)

    await outputFile(join(BASE_PATH, 'ts/server.d.ts'), `export const loaded = true`)
    await outputFile(join(BASE_PATH, 'js/config.js'), `module.exports = { loaded: true }`)
    await outputFile(join(BASE_PATH, 'json/main.json'), `{ "loaded": true }`)

    const output = requireAll(BASE_PATH)
    assert.deepEqual(output, {
      ts: {
        app: { loaded: true },
      },
      js: {
        config: { loaded: true },
      },
      json: {
        main: { loaded: true },
      },
    })
  })

  test('raise error when files are missing', async (assert) => {
    const fn = () => requireAll(BASE_PATH)
    assert.throw(fn, /ENOENT: no such file or directory, scandir/)
  })

  test('ignore when optional is true and files are missing', async (assert) => {
    const fn = () => requireAll(BASE_PATH, true, true)
    assert.doesNotThrow(fn)
  })
})
