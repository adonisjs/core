/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'reflect-metadata'
import stripAnsi from 'strip-ansi'
import { test } from '@japa/runner'
import { Ioc } from '@adonisjs/fold'
import { Kernel } from '@adonisjs/ace'
import { testingRenderer } from '@poppinss/cliui'
import { Application } from '@adonisjs/application'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { Router } from '@adonisjs/http-server/build/src/Router'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { PreCompiler } from '@adonisjs/http-server/build/src/Server/PreCompiler/index'

import ListRoutes from '../../commands/ListRoutes'

const ioc = new Ioc()
const precompiler = new PreCompiler(ioc, {
  get() {},
  getNamed(name: string) {
    return { name }
  },
} as any)

let app: ApplicationContract
let router: RouterContract
let listRoutes: ListRoutes

test.group('Command | List Routes Pretty', (group) => {
  group.each.setup(async () => {
    app = new Application(__dirname, 'test', {})
    router = new Router({} as any, precompiler.compileRoute.bind(precompiler))
    app.container.bind('Adonis/Core/Route', () => router)

    listRoutes = new ListRoutes(app, new Kernel(app))
    listRoutes.logger.useRenderer(testingRenderer)
    // @ts-ignore
    listRoutes.maxWidth = 50
  })

  group.each.teardown(() => {
    testingRenderer.logs = []
  })

  test('each part should be correctly aligned', async ({ assert }) => {
    router.get('about', async () => {})
    router.post('contact', async () => {})
    router.commit()

    await listRoutes.run()

    const output = testingRenderer.logs.map(({ message }) => stripAnsi(message))
    assert.deepEqual(output, [
      'GET|HEAD    /about ─────────────────────── Closure',
      'POST        /contact ───────────────────── Closure',
    ])
  })

  test('list routes with controllers', async ({ assert }) => {
    ioc.bind('App/Controllers/Http/TestController', () => {})
    ioc.bind('App/Controllers/Http/AdonisTestControllerTest', () => {})

    router.get('about', async () => {})
    router.post('contact', 'TestController.test')
    router.post('my-super-long-route-name', 'AdonisTestControllerTest.index')
    router.post('end', 'AdonisTestControllerTest.index')
    router.commit()

    await listRoutes.run()

    const output = testingRenderer.logs.map(({ message }) => stripAnsi(message))
    assert.deepEqual(output, [
      'GET|HEAD    /about ─────────────────────── Closure',
      'POST        /contact ───────── TestController.test',
      'POST        /my-super-long-route-name  AdonisTest…',
      'POST        /end ── AdonisTestControllerTest.index',
    ])
  })

  test('list routes with verbose mode', async ({ assert }) => {
    ioc.bind('App/Controllers/Http/TestController', () => {})
    ioc.bind('App/Controllers/Http/AdonisTestControllerTest', () => {})

    router.get('about', async () => {})
    router.post('contact', 'TestController.test').middleware('throttle:10,1')
    router.post('my-super-long-route-name', 'AdonisTestControllerTest.index')
    router.post('end', 'AdonisTestControllerTest.index').middleware('auth')
    router.commit()

    listRoutes.verbose = true
    await listRoutes.run()

    const output = testingRenderer.logs.map(({ message }) => stripAnsi(message))
    assert.deepEqual(output, [
      'GET|HEAD    /about ─────────────────────── Closure',
      'POST        /contact ───────── TestController.test',
      '             ├── throttle:10,1',
      'POST        /my-super-long-route-name  AdonisTest…',
      'POST        /end ── AdonisTestControllerTest.index',
      '             ├── auth',
    ])
  })
})
