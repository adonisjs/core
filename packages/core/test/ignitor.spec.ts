/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { join } from 'path'
import * as supertest from 'supertest'
import { createServer } from 'http'
import * as clearModule from 'clear-module'
import { remove, outputJSON, outputFile } from 'fs-extra'

import { Ignitor } from '../src/Ignitor'

const APP_ROOT = join(__dirname, 'app')

test.group('Ignitor | loadRcFile', (group) => {
  group.afterEach(async () => {
    await remove(APP_ROOT)
  })

  test('use defaults when rc file is missing', (assert) => {
    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    assert.deepEqual(ignitor.directories, {
      database: './database',
      public: './public',
      start: './start',
      tmp: './tmp',
      views: './resources/views',
      config: './config',
      migrations: './database/migrations',
      resources: './resources',
      seeds: './database/seeds',
    })

    assert.deepEqual(ignitor.autoloads, { App: './app' })
    assert.isFalse(ignitor.typescript)
  })

  test('merge .adonisrc.json with default when file exists', async (assert) => {
    await outputJSON(join(APP_ROOT, '.adonisrc.json'), {
      typescript: true,
      autoloads: {
        Admin: './app',
      },
      directories: {
        uploads: './uploads',
      },
    })

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    assert.deepEqual(ignitor.directories, {
      database: './database',
      public: './public',
      start: './start',
      tmp: './tmp',
      views: './resources/views',
      uploads: './uploads',
      config: './config',
      migrations: './database/migrations',
      resources: './resources',
      seeds: './database/seeds',
    })

    assert.deepEqual(ignitor.autoloads, { Admin: './app' })
    assert.isTrue(ignitor.typescript)

    clearModule(join(APP_ROOT, '.adonisrc.json'))
  })
})

test.group('Ignitor | loadAppFile', (group) => {
  group.afterEach(async () => {
    await remove(APP_ROOT)
  })

  test('raise error if start/app.js file is missing', (assert) => {
    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    const fn = () => ignitor['_loadAppFile']()
    assert.throw(fn, /Cannot find module/)
  })

  test('raise error if app file is missing providers, aceProviders or commands', async (assert) => {
    await outputFile(join(APP_ROOT, 'start/app.js'), `
      module.exports = {
        providers: [],
        aceProviders: []
      }
    `)

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    const fn = () => ignitor['_loadAppFile']()
    assert.throw(fn, 'E_MISSING_APP_ESSENTIALS: export `commands` from `./start/app` file')

    clearModule(join(APP_ROOT, 'start/app.js'))
  })

  test('load start/app.ts file', async (assert) => {
    await outputFile(join(APP_ROOT, 'start-ts/app.ts'), `
    export const providers = []
    export const aceProviders = []
    export const commands = []
    `)

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()

    /**
     * Node internally caches the extension for the file and hence, we need
     * to change the directory to load the same file but with different
     * extension
     */
    ignitor.directories.start = 'start-ts'

    assert.deepEqual(ignitor['_loadAppFile'](), {
      providers: [],
      aceProviders: [],
      commands: [],
    })

    clearModule(join(APP_ROOT, 'start-ts/app.ts'))
  })
})

test.group('Ignitor | boot providers', (group) => {
  group.afterEach(async () => {
    await remove(APP_ROOT)
  })

  test('register and boot providers', async (assert) => {
    await outputFile(join(APP_ROOT, 'start/app.js'), `
      const { join } = require('path')

      module.exports = {
        providers: [
          join(__dirname, 'AppProvider.js')
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await outputFile(join(APP_ROOT, 'start/AppProvider.js'), `
      module.exports = class AppProvider {
        register () {
          global['AppProvider'] = ['registered']
        }

        boot () {
          global['AppProvider'].push('booted')
        }
      }
    `)

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    await ignitor['_bootProviders']()

    assert.deepEqual(global['AppProvider'], ['registered', 'booted'])

    clearModule(join(APP_ROOT, 'start/app.js'))
    clearModule(join(APP_ROOT, 'start/AppProvider.js'))
    delete global['AppProvider']
  })
})

test.group('Ignitor | preload files', (group) => {
  group.afterEach(async () => {
    await remove(APP_ROOT)
  })

  test('preload all files with no intent', async (assert) => {
    await outputJSON(join(APP_ROOT, '.adonisrc.json'), {
      preloads: [
        {
          file: 'start/kernel',
        },
        {
          file: 'start/routes',
        },
      ],
    })

    await outputFile(join(APP_ROOT, 'start/kernel.js'), `global['START_KERNEL'] = true`)
    await outputFile(join(APP_ROOT, 'start/routes.js'), `global['START_ROUTES'] = true`)

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    ignitor['_instantiateProfiler']()
    ignitor['_preloadFiles']()

    assert.isTrue(global['START_KERNEL'])
    assert.isTrue(global['START_ROUTES'])

    clearModule(join(APP_ROOT, '.adonisrc.json'))
    clearModule(join(APP_ROOT, 'start/routes.js'))
    clearModule(join(APP_ROOT, 'start/kernel.js'))
    delete global['START_KERNEL']
    delete global['START_ROUTES']
  })

  test('preload files for the selected intent only', async (assert) => {
    await outputJSON(join(APP_ROOT, '.adonisrc.json'), {
      preloads: [
        {
          file: 'start/kernel',
          intent: 'http',
        },
        {
          file: 'start/routes',
          intent: 'ace',
        },
      ],
    })

    await outputFile(join(APP_ROOT, 'start/kernel.js'), `global['START_KERNEL'] = true`)
    await outputFile(join(APP_ROOT, 'start/routes.js'), `global['START_ROUTES'] = true`)

    const ignitor = new Ignitor(APP_ROOT)
    ignitor['_intent'] = 'ace'
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    ignitor['_instantiateProfiler']()
    ignitor['_preloadFiles']()

    assert.isUndefined(global['START_KERNEL'])
    assert.isTrue(global['START_ROUTES'])

    clearModule(join(APP_ROOT, '.adonisrc.json'))
    clearModule(join(APP_ROOT, 'start/routes.js'))
    clearModule(join(APP_ROOT, 'start/kernel.js'))
    delete global['START_KERNEL']
    delete global['START_ROUTES']
  })
})

test.group('Ignitor | http server', (group) => {
  group.afterEach(async () => {
    delete process.env.ENV_SILENT
    await remove(APP_ROOT)
  })

  test('start http server on defined host and port', async (assert) => {
    process.env.ENV_SILENT = 'true'
    await outputJSON(join(APP_ROOT, '.adonisrc.json'), {
      typescript: true,
      preloads: [{ file: 'start/routes' }],
    })

    await outputFile(join(APP_ROOT, 'start/app.js'), `
      const { join } = require('path')

      module.exports = {
        providers: [
          join(__dirname, '..', '..', '..', 'providers', 'AppProvider')
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await outputFile(join(APP_ROOT, 'start/routes.js'), `
      const Route = use('Route')
      Route.get('/', async ({ response }) => {
        response.send('handled')
      })
    `)

    const ignitor = new Ignitor(APP_ROOT)
    await ignitor.startHttpServer((handler) => {
      return createServer(handler)
    })

    const { text } = await supertest(ignitor.server).get('/').expect(200)
    assert.equal(text, 'handled')

    clearModule(join(APP_ROOT, '.adonisrc.json'))
    clearModule(join(APP_ROOT, 'start/app.js'))
    clearModule(join(APP_ROOT, 'start/routes.js'))
  }).timeout(0)
})
