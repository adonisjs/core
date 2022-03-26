/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'reflect-metadata'
import { test } from '@japa/runner'
import { Ioc } from '@adonisjs/fold'
import { Kernel } from '@adonisjs/ace'
import { testingRenderer } from '@poppinss/cliui'
import { Application } from '@adonisjs/application'
import { Router } from '@adonisjs/http-server/build/src/Router'
import { PreCompiler } from '@adonisjs/http-server/build/src/Server/PreCompiler/index'

import ListRoutes from '../../commands/ListRoutes'

const ioc = new Ioc()
const precompiler = new PreCompiler(ioc, {
  get() {},
  getNamed(name: string) {
    return { name }
  },
} as any)

test.group('Command | List Routes Json', (group) => {
  group.each.teardown(() => {
    testingRenderer.logs = []
  })

  test('list routes in the order they are registered', async ({ assert }) => {
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
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
            {
              domain: 'root',
              name: '',
              pattern: '/contact',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('list routes with middleware', async ({ assert }) => {
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
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
            {
              domain: 'root',
              name: '',
              pattern: '/contact',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: ['auth', 'acl:admin'],
            },
          ],
        },
      ]
    )
  })

  test('list routes with controller handlers', async ({ assert }) => {
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
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'HomeController.index',
              middleware: [],
            },
            {
              domain: 'root',
              name: '',
              pattern: '/contact',
              methods: ['GET', 'HEAD'],
              handler: 'ContactController.handle',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('output complete controller namespace when using a custom namespace', async ({ assert }) => {
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
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'HomeController.index',
              middleware: [],
            },
            {
              domain: 'root',
              name: '',
              pattern: '/contact',
              methods: ['GET', 'HEAD'],
              handler: 'App/Admin/ContactController.handle',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('ignore custom namespace when its same as the default namespace', async ({ assert }) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    ioc.bind('App/Controllers/Http/HomeController', () => {})
    ioc.bind('App/Controllers/Http/ContactController', () => {})

    router.get('about', 'HomeController.index')
    router.get('contact', 'ContactController').namespace('App/Controllers/Http')
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
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'HomeController.index',
              middleware: [],
            },
            {
              domain: 'root',
              name: '',
              pattern: '/contact',
              methods: ['GET', 'HEAD'],
              handler: 'ContactController.handle',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('output route custom domain', async ({ assert }) => {
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
              domain: 'blogger.com',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('prefix route group pattern', async ({ assert }) => {
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
              domain: 'blogger.com',
              name: '',
              pattern: '/v1/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('filter routes by method', async ({ assert }) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.post('contact', async () => {})
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    listRoutes.methodsFilter = ['GET']
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('filter routes by name', async ({ assert }) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.post('contact', async () => {}).as('contactUs')
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    listRoutes.namesFilter = ['contactUs']
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              domain: 'root',
              name: 'contactUs',
              pattern: '/contact',
              methods: ['POST'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('filter routes by route pattern', async ({ assert }) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.post('contact', async () => {})
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    listRoutes.patternsFilter = ['/ab']
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [
            {
              domain: 'root',
              name: '',
              pattern: '/about',
              methods: ['GET', 'HEAD'],
              handler: 'Closure',
              middleware: [],
            },
          ],
        },
      ]
    )
  })

  test('apply a combination of filters', async ({ assert }) => {
    const app = new Application(__dirname, 'test', {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.post('about', async () => {})
    router.put('about', async () => {}).as('editDetails')
    router.get('contact', async () => {})
    router.commit()

    app.container.bind('Adonis/Core/Route', () => router)

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    listRoutes.json = true
    listRoutes.patternsFilter = ['/ab']
    listRoutes.methodsFilter = ['GET']
    listRoutes.namesFilter = ['editDetails']
    await listRoutes.run()

    assert.deepEqual(
      testingRenderer.logs.map(({ message }) => JSON.parse(message)),
      [
        {
          root: [],
        },
      ]
    )
  })
})
