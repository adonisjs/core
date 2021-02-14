/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import 'reflect-metadata'
import { Ioc } from '@adonisjs/fold'
import { Kernel } from '@adonisjs/ace'
import { testingRenderer } from '@poppinss/cliui'
import { Application } from '@adonisjs/application'
import { Router } from '@adonisjs/http-server/build/src/Router'
import { PreCompiler } from '@adonisjs/http-server/build/src/Server/PreCompiler/index'

import ListRoutes from '../commands/ListRoutes'

const ioc = new Ioc()
const precompiler = new PreCompiler(ioc, {
  get() {},
  getNamed(name: string) {
    return { name }
  },
} as any)

test.group('Command | List Routes', (group) => {
  group.afterEach(() => {
    testingRenderer.logs = []
  })

  test('list routes in the order they are register', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.get('contact', async () => {})
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              methods: ['HEAD', 'GET'],
              name: '',
              pattern: '/about',
              handler: 'Closure',
              middleware: [],
            },
            {
              methods: ['HEAD', 'GET'],
              name: '',
              pattern: '/contact',
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('list routes with assigned middleware', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.get('contact', async () => {}).middleware(['auth', 'acl:admin'])
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              methods: ['HEAD', 'GET'],
              name: '',
              pattern: '/about',
              handler: 'Closure',
              middleware: [],
            },
            {
              methods: ['HEAD', 'GET'],
              name: '',
              pattern: '/contact',
              handler: 'Closure',
              middleware: ['auth', 'acl:admin'],
            },
          ],
        },
      ]
    )
  })

  test('list routes with controller handlers', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    ioc.bind('App/Controllers/Http/HomeController', () => {})
    ioc.bind('App/Controllers/Http/ContactController', () => {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', 'HomeController.index')
    router.get('contact', 'ContactController')
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    listRoutes.logger.useRenderer(testingRenderer)
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              methods: ['HEAD', 'GET'],
              pattern: '/about',
              name: '',
              handler: 'HomeController.index',
              middleware: [],
            },
            {
              methods: ['HEAD', 'GET'],
              pattern: '/contact',
              name: '',
              handler: 'ContactController.handle',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('output complete controller namespace when using a custom namespace', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    ioc.bind('App/Controllers/Http/HomeController', () => {})
    ioc.bind('App/Admin/ContactController', () => {})

    router.get('about', 'HomeController.index')
    router.get('contact', 'ContactController').namespace('App/Admin')
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    listRoutes.logger.useRenderer(testingRenderer)
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              methods: ['HEAD', 'GET'],
              pattern: '/about',
              name: '',
              handler: 'HomeController.index',
              middleware: [],
            },
            {
              methods: ['HEAD', 'GET'],
              pattern: '/contact',
              name: '',
              handler: 'App/Admin/ContactController.handle',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('output route custom domain', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))

    router.get('about', async () => {}).domain('blogger.com')
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    listRoutes.logger.useRenderer(testingRenderer)
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          'blogger.com': [
            {
              methods: ['HEAD', 'GET'],
              pattern: '/about',
              handler: 'Closure',
              name: '',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('prefix route group pattern', async (assert) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))

    router
      .group(() => {
        router.get('about', async () => {}).domain('blogger.com')
      })
      .prefix('v1')

    router.commit()
    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    listRoutes.logger.useRenderer(testingRenderer)
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          'blogger.com': [
            {
              methods: ['HEAD', 'GET'],
              pattern: '/v1/about',
              handler: 'Closure',
              name: '',
              middleware: [],
            },
          ],
        },
      ]
    )
  })
})
