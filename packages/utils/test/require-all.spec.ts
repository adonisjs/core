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
import { Filesystem } from '@adonisjs/dev-utils'

import { requireAll } from '../src/requireAll'
const fs = new Filesystem(join(__dirname, 'app'))

test.group('require all', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('require .js, .ts and .json files from the disk', async (assert) => {
    await fs.add('app.ts', `export default {
      loaded: true
    }`)

    await fs.add('server.ts', `export const loaded = true`)
    await fs.add('config.js', `module.exports = { loaded: true }`)
    await fs.add('main.json', `{ "loaded": true }`)

    const output = requireAll(fs.basePath)
    assert.deepEqual(output, {
      app: { loaded: true },
      server: { loaded: true },
      config: { loaded: true },
      main: { loaded: true },
    })
  })

  test('require files recursively', async (assert) => {
    await fs.add('ts/app.ts', `export default {
      loaded: true
    }`)

    await fs.add('ts/server.ts', `export const loaded = true`)
    await fs.add('js/config.js', `module.exports = { loaded: true }`)
    await fs.add('json/main.json', `{ "loaded": true }`)

    const output = requireAll(fs.basePath)
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
    await fs.add('ts/app.ts', `export default {
      loaded: true
    }`)

    await fs.add('ts/server.ts', `export const loaded = true`)
    await fs.add('js/config.js', `module.exports = { loaded: true }`)
    await fs.add('json/main.json', `{ "loaded": true }`)

    const output = requireAll(fs.basePath, false)
    assert.deepEqual(output, {})
  })

  test('ignore .d.ts files', async (assert) => {
    await fs.add('ts/app.ts', `export default {
      loaded: true
    }`)

    await fs.add('ts/server.d.ts', `export const loaded = true`)
    await fs.add('js/config.js', `module.exports = { loaded: true }`)
    await fs.add('json/main.json', `{ "loaded": true }`)

    const output = requireAll(fs.basePath)
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
    const fn = () => requireAll(fs.basePath)
    assert.throw(fn, /ENOENT: no such file or directory, scandir/)
  })

  test('ignore when optional is true and files are missing', async (assert) => {
    const fn = () => requireAll(fs.basePath, true, true)
    assert.doesNotThrow(fn)
  })
})
