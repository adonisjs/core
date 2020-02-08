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
import { Router } from '@adonisjs/http-server/build/src/Router'
import { Application } from '@adonisjs/application/build/standalone'
import { PreCompiler } from '@adonisjs/http-server/build/src/Server/PreCompiler/index'

import ListRoutes from '../commands/ListRoutes'

const ioc = new Ioc()
const precompiler = new PreCompiler(ioc, {
  get () {},
  getNamed (name: string) {
    return { name }
  },
} as any)

test.group('Command | List Routes', () => {
  test('list routes in the order they are register', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.get('contact', async () => {})
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/about',
        handler: 'Closure',
        middleware: [],
        domain: 'NA',
      },
      {
        methods: ['GET'],
        pattern: '/contact',
        handler: 'Closure',
        middleware: [],
        domain: 'NA',
      },
    ])
  })

  test('list routes with assigned middleware', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', async () => {})
    router.get('contact', async () => {}).middleware(['auth', 'acl:admin'])
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/about',
        handler: 'Closure',
        middleware: [],
        domain: 'NA',
      },
      {
        methods: ['GET'],
        pattern: '/contact',
        handler: 'Closure',
        middleware: ['auth', 'acl:admin'],
        domain: 'NA',
      },
    ])
  })

  test('list routes with controller handlers', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    ioc.bind('App/Controllers/Http/HomeController', () => {})
    ioc.bind('App/Controllers/Http/ContactController', () => {})

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    router.get('about', 'HomeController.index')
    router.get('contact', 'ContactController')
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/about',
        handler: 'HomeController.index',
        middleware: [],
        domain: 'NA',
      },
      {
        methods: ['GET'],
        pattern: '/contact',
        handler: 'ContactController.handle',
        middleware: [],
        domain: 'NA',
      },
    ])
  })

  test('output complete controller namespace when using a custom namespace', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    ioc.bind('App/Controllers/Http/HomeController', () => {})
    ioc.bind('App/Admin/ContactController', () => {})

    router.get('about', 'HomeController.index')
    router.get('contact', 'ContactController').namespace('App/Admin')
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/about',
        handler: 'HomeController.index',
        middleware: [],
        domain: 'NA',
      },
      {
        methods: ['GET'],
        pattern: '/contact',
        handler: 'App/Admin/ContactController.handle',
        middleware: [],
        domain: 'NA',
      },
    ])
  })

  test('output route custom domain', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))

    router.get('about', async () => {}).domain('blogger.com')
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/about',
        handler: 'Closure',
        middleware: [],
        domain: 'blogger.com',
      },
    ])
  })

  test('prefix route group pattern', async (assert) => {
    const app = new Application(__dirname, {} as any, {} as any, {})
    app.environment = 'test'

    const router = new Router({} as any, precompiler.compileRoute.bind(precompiler))

    router.group(() => {
      router.get('about', async () => {}).domain('blogger.com')
    }).prefix('v1')
    router.commit()

    const listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.json = true
    await listRoutes.handle(router)

    assert.deepEqual(JSON.parse(listRoutes.logger.logs[0]), [
      {
        methods: ['GET'],
        pattern: '/v1/about',
        handler: 'Closure',
        middleware: [],
        domain: 'blogger.com',
      },
    ])
  })
})
