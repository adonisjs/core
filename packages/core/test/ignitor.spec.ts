/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import * as test from 'japa'
import * as supertest from 'supertest'
import { createServer } from 'http'
import { Filesystem } from '@adonisjs/dev-utils'

import { Ignitor } from '../src/Ignitor'

const fs = new Filesystem(join(__dirname, 'app'))
const AppProvider = join(__dirname, '..', 'providers', 'AppProvider')

test.group('Ignitor | loadRcFile', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('use defaults when rc file is missing', (assert) => {
    const ignitor = new Ignitor(fs.basePath)
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
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      autoloads: {
        Admin: './app',
      },
      directories: {
        uploads: './uploads',
      },
    }))

    const ignitor = new Ignitor(fs.basePath)
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
  })
})

test.group('Ignitor | loadAppFile', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('raise error if start/app.js file is missing', (assert) => {
    const ignitor = new Ignitor(fs.basePath)
    ignitor['_loadRcFile']()

    const fn = () => ignitor['_loadAppFile']()
    assert.throw(fn, /Cannot find module/)
  })

  test('raise error if app file is missing providers, aceProviders or commands', async (assert) => {
    await fs.add('start/app.js', `
      module.exports = {
        providers: [],
        aceProviders: []
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    ignitor['_loadRcFile']()

    const fn = () => ignitor['_loadAppFile']()
    assert.throw(fn, 'E_MISSING_APP_ESSENTIALS: export `commands` from `./start/app` file')
  })

  test('load start/app.ts file', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      directories: {
        start: './start-ts',
      },
    }))

    await fs.add('start-ts/app.ts', `
    export const providers = []
    export const aceProviders = []
    export const commands = []
    `)

    const ignitor = new Ignitor(fs.basePath)
    ignitor['_loadRcFile']()

    assert.deepEqual(ignitor['_loadAppFile'](), {
      providers: [],
      aceProviders: [],
      commands: [],
    })
  })
})

test.group('Ignitor | boot providers', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('register and boot providers', async (assert) => {
    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          join(__dirname, 'AppProvider.js')
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await fs.add('start/AppProvider.js', `
      module.exports = class AppProvider {
        register () {
          global['AppProvider'] = ['registered']
        }

        boot () {
          global['AppProvider'].push('booted')
        }
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    await ignitor['_bootProviders']()

    assert.deepEqual(global['AppProvider'], ['registered', 'booted'])
    delete global['AppProvider']
  })
})

test.group('Ignitor | preload files', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('preload all files with no intent', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
      preloads: [
        {
          file: 'start/kernel',
        },
        {
          file: 'start/routes',
        },
      ],
    }))

    await fs.add('start/kernel.js', `global['START_KERNEL'] = true`)
    await fs.add('start/routes.js', `global['START_ROUTES'] = true`)

    const ignitor = new Ignitor(fs.basePath)
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    ignitor['_instantiateProfiler']()
    ignitor['_preloadFiles']()

    assert.isTrue(global['START_KERNEL'])
    assert.isTrue(global['START_ROUTES'])

    delete global['START_KERNEL']
    delete global['START_ROUTES']
  })

  test('preload files for the selected intent only', async (assert) => {
    await fs.add('.adonisrc.json', JSON.stringify({
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
    }))

    await fs.add('start/kernel.js', `global['START_KERNEL'] = true`)
    await fs.add('start/routes.js', `global['START_ROUTES'] = true`)

    const ignitor = new Ignitor(fs.basePath)
    ignitor['_intent'] = 'ace'
    ignitor['_loadRcFile']()
    ignitor['_instantiateIoCContainer']()
    ignitor['_instantiateProfiler']()
    ignitor['_preloadFiles']()

    assert.isUndefined(global['START_KERNEL'])
    assert.isTrue(global['START_ROUTES'])
    delete global['START_KERNEL']
    delete global['START_ROUTES']
  })
})

test.group('Ignitor | http server', (group) => {
  group.timeout(0)

  group.beforeEach(async () => {
    process.env.PORT = '4000'
    await fs.cleanup()
  })

  group.afterEach(async () => {
    delete process.env.PORT
    await fs.cleanup()
  })

  test('start http server on defined host and port', async (assert, done) => {
    await fs.addEnv('.env', {})
    await fs.add('config/app.js', `module.exports = { appKey: 'hell-world' }`)
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      preloads: [{ file: 'start/routes' }],
    }))

    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          '${AppProvider}'
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await fs.add('start/routes.js', `
      const Route = use('Route')
      Route.get('/', async ({ response }) => {
        response.send('handled')
      })
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer((handler) => {
      return createServer(handler)
    })

    const { text } = await supertest(ignitor.server).get('/').expect(200)
    assert.equal(text, 'handled')
    ignitor.server.close(done)
  })

  test('pass exceptions to custom http exception handler', async (assert, done) => {
    await fs.addEnv('.env', {})
    await fs.add('config/app.js', `module.exports = { appKey: 'hell-world' }`)
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
      exceptionHandlerNamespace: 'App/Exceptions/Handler',
    }))

    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          '${AppProvider}'
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await fs.add('app/Exceptions/Handler.js', `
      module.exports = class Handler {
        handle () {
          return 'error handler response'
        }

        report () {
        }
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer((handler) => {
      return createServer(handler)
    })

    const { text } = await supertest(ignitor.server).get('/').expect(200)
    assert.equal(text, 'error handler response')
    ignitor.server.close(done)
  })

  test('execute onHttpServer hook', async (assert, done) => {
    await fs.addEnv('.env', {})
    await fs.add('config/app.js', `module.exports = { appKey: 'hell-world' }`)
    await fs.add('.adonisrc.json', JSON.stringify({ typescript: true }))

    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          '${AppProvider}',
          join(__dirname, '..', 'providers', 'MyProvider')
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await fs.add('providers/MyProvider.js', `
      module.exports = class MyProvider {
        onHttpServer () {
          process.env.onHttpServer = true
        }
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer()
    assert.equal(process.env.onHttpServer, 'true')

    delete process.env.onHttpServer
    ignitor.server.close(done)
  })

  test('remove providers reference after boot', async (assert, done) => {
    await fs.addEnv('.env', {})
    await fs.add('config/app.js', `module.exports = { appKey: 'hell-world' }`)
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
    }))

    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          '${AppProvider}'
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer()

    assert.deepEqual(ignitor['_providersList'], [])
    assert.lengthOf(ignitor['_providersWithExitHook'], 0)

    ignitor.server.close(done)
  })

  test('hold reference to providers with onExit hook', async (assert, done) => {
    await fs.addEnv('.env', {})
    await fs.add('config/app.js', `module.exports = { appKey: 'hell-world' }`)
    await fs.add('.adonisrc.json', JSON.stringify({
      typescript: true,
    }))

    await fs.add('start/app.js', `
      const { join } = require('path')

      module.exports = {
        providers: [
          '${AppProvider}',
          join(__dirname, '..', 'providers', 'MyProvider')
        ],
        aceProviders: [],
        commands: [],
      }
    `)

    await fs.add('providers/MyProvider.js', `
      module.exports = class MyProvider {
        onExit () {
        }
      }
    `)

    const ignitor = new Ignitor(fs.basePath)
    await ignitor.startHttpServer()

    assert.deepEqual(ignitor['_providersList'], [])
    assert.lengthOf(ignitor['_providersWithExitHook'], 1)
    ignitor.server.close(done)
  })
})
