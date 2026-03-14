/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import type { ApplicationService } from '../../src/types.ts'
import { IgnitorFactory } from '../../factories/core/ignitor.ts'
import { createAceKernel } from '../../modules/ace/create_kernel.ts'
import { RoutesListFormatter } from '../../src/cli_formatters/routes_list.ts'

/**
 * Registers routes for testing
 */
async function registerRoutes(app: ApplicationService) {
  class AboutController {
    async handle() {}
  }
  class UsersController {
    async handle() {}
  }
  class AuthMiddleware {
    async handle() {}
  }
  const ContactController = () => import('#controllers/contacts_controller' as any)

  const router = await app.container.make('router')
  const middleware = router.named({
    auth: async () => {
      return {
        default: AuthMiddleware,
      }
    },
    throttle: async () => {
      return {
        default: class ThrottleMiddleware {
          async handle() {}
        },
      }
    },
    signed: async () => {
      return {
        default: class SignedMiddleware {
          async handle() {}
        },
      }
    },
    acl: async () => import('#middleware/acl_middleware' as any),
  })

  router.use([
    async () => {
      return {
        default: class BodyParserMiddleware {
          async handle() {}
        },
      }
    },
  ])

  router.get('/', () => {})
  router.get('/files/:directory/*', () => {})
  router.get('/home', '#controllers/home_controller').as('home')
  router
    .get('/about', [AboutController])
    .as('about')
    .use(() => {})

  router.post('/contact', [ContactController, 'store']).as('contact.store')
  router.get('/contact', [ContactController, 'create']).as('contact.create')

  router
    .get('users', [UsersController, 'handle'])
    .use(middleware.auth())
    .use(function canViewUsers() {})
    .use(() => {})

  router
    .get('payments', [() => import('#controllers/payments_controller' as any), 'index'])
    .use(middleware.auth())
    .use(middleware.acl())
    .use(middleware.signed())
    .use(middleware.throttle())

  router
    .get('/articles', [() => import('#controllers/articles_controller' as any), 'index'])
    .as('articles')
    .domain('blog.adonisjs.com')

  router
    .get('/articles/:id/:slug?', [() => import('#controllers/articles_controller' as any), 'show'])
    .as('articles.show')
    .domain('blog.adonisjs.com')

  /**
   * The redirect method is now typed
   */
  ;(router.on('/blog').redirect as any)('/articles')
}

test.group('Formatters | List routes | toJSON', () => {
  test('format routes as JSON', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(router, createAceKernel(app).ui, {}, {})
    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "args": undefined,
                "name": "closure",
                "type": "closure",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/",
            },
            {
              "handler": {
                "args": undefined,
                "name": "closure",
                "type": "closure",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/files/:directory/*",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "#controllers/home_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "home",
              "pattern": "/home",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "AboutController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "about",
              "pattern": "/about",
            },
            {
              "handler": {
                "method": "store",
                "moduleNameOrPath": "#controllers/contacts_controller",
                "type": "controller",
              },
              "methods": [
                "POST",
              ],
              "middleware": [],
              "name": "contact.store",
              "pattern": "/contact",
            },
            {
              "handler": {
                "method": "create",
                "moduleNameOrPath": "#controllers/contacts_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "contact.create",
              "pattern": "/contact",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/payments_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "#middleware/acl_middleware",
                  "name": "acl",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "signed",
                  "name": "signed",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "throttle",
                  "name": "throttle",
                  "type": "named",
                },
              ],
              "name": "",
              "pattern": "/payments",
            },
            {
              "handler": {
                "args": "/articles",
                "name": "redirectsToRoute",
                "type": "closure",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/blog",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/articles_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "articles",
              "pattern": "/articles",
            },
            {
              "handler": {
                "method": "show",
                "moduleNameOrPath": "#controllers/articles_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [],
              "name": "articles.show",
              "pattern": "/articles/:id/:slug?",
            },
          ],
        },
      ]
    `)
  })

  test('show HEAD routes', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      { displayHeadRoutes: true },
      {}
    )
    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "args": undefined,
                "name": "closure",
                "type": "closure",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/",
            },
            {
              "handler": {
                "args": undefined,
                "name": "closure",
                "type": "closure",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/files/:directory/*",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "#controllers/home_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "home",
              "pattern": "/home",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "AboutController",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "about",
              "pattern": "/about",
            },
            {
              "handler": {
                "method": "store",
                "moduleNameOrPath": "#controllers/contacts_controller",
                "type": "controller",
              },
              "methods": [
                "POST",
              ],
              "middleware": [],
              "name": "contact.store",
              "pattern": "/contact",
            },
            {
              "handler": {
                "method": "create",
                "moduleNameOrPath": "#controllers/contacts_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "contact.create",
              "pattern": "/contact",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/payments_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "#middleware/acl_middleware",
                  "name": "acl",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "signed",
                  "name": "signed",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "throttle",
                  "name": "throttle",
                  "type": "named",
                },
              ],
              "name": "",
              "pattern": "/payments",
            },
            {
              "handler": {
                "args": "/articles",
                "name": "redirectsToRoute",
                "type": "closure",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "",
              "pattern": "/blog",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/articles_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "articles",
              "pattern": "/articles",
            },
            {
              "handler": {
                "method": "show",
                "moduleNameOrPath": "#controllers/articles_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
                "HEAD",
              ],
              "middleware": [],
              "name": "articles.show",
              "pattern": "/articles/:id/:slug?",
            },
          ],
        },
      ]
    `)
  })

  test('format routes as ANSI list', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const cliUi = createAceKernel(app).ui
    cliUi.switchMode('silent')

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      cliUi,
      {
        maxPrettyPrintWidth: 100,
      },
      {}
    )

    assert.deepEqual(await formatter.formatAsAnsiList(), [
      {
        heading: '',
        rows: [
          `METHOD ROUTE ................................................... HANDLER                  MIDDLEWARE`,
          `GET    / ....................................................... closure                            `,
          `GET    /files/:directory/* ..................................... closure                            `,
          `GET    /home (home) ................ #controllers/home_controller.handle                            `,
          `GET    /about (about) ........................... AboutController.handle                     closure`,
          `POST   /contact (contact.store) . #controllers/contacts_controller.store                            `,
          `GET    /contact (contact.create)  #controllers/contacts_controller.crea…                            `,
          `GET    /users (users) ........................... UsersController.handle auth, canViewUsers, closure`,
          `GET    /payments ................ #controllers/payments_controller.index       auth, acl, and 2 more`,
          `GET    /blog ..............................  redirectsToRoute(/articles)                            `,
        ],
      },
      {
        heading:
          '.. blog.adonisjs.com ...............................................................................',
        rows: [
          `METHOD ROUTE .................................................................... HANDLER MIDDLEWARE`,
          `GET    /articles (articles) ...................... #controllers/articles_controller.index           `,
          `GET    /articles/:id/:slug? (articles.show) ....... #controllers/articles_controller.show           `,
        ],
      },
    ])
  })

  test('format routes as ANSI table', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const cliUi = createAceKernel(app).ui
    cliUi.switchMode('raw')

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      cliUi,
      {
        maxPrettyPrintWidth: 100,
      },
      {}
    )

    const tables = await formatter.formatAsAnsiTable()
    tables[0].table.render()

    assert.deepEqual(cliUi.logger.getLogs(), [
      {
        message: 'dim(METHOD)|dim(ROUTE)|dim(HANDLER)|dim(MIDDLEWARE)',
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/ | cyan(closure)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/files/yellow(:directory)/red(*) | cyan(closure)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/home dim((home)) | cyan(#controllers/home_controller).cyan(handle)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/about dim((about)) | cyan(AboutController).cyan(handle)|dim(closure)`,
        stream: 'stdout',
      },
      {
        message: `dim(POST)|/contact dim((contact.store)) | cyan(#controllers/contacts_controller).cyan(store)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/contact dim((contact.create)) | cyan(#controllers/contacts_controller).cyan(create)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/users dim((users)) | cyan(UsersController).cyan(handle)|dim(auth, canViewUsers, closure)`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/payments | cyan(#controllers/payments_controller).cyan(index)|dim(auth, acl, signed, throttle)`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/blog |  cyan(redirectsToRoute)dim((/articles))|dim()`,
        stream: 'stdout',
      },
    ])
  })
})

test.group('Formatters | List routes | toJSONL', () => {
  test('format routes as JSONL', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(router, createAceKernel(app).ui, {}, {})
    const lines = await formatter.formatAsJSONL()
    const parsed = lines.map((line) => JSON.parse(line))

    assert.snapshot(parsed).matchInline(`
      [
        {
          "handler": {
            "name": "closure",
            "type": "closure",
          },
          "method": "GET",
          "pattern": "/",
        },
        {
          "handler": {
            "name": "closure",
            "type": "closure",
          },
          "method": "GET",
          "pattern": "/files/:directory/*",
        },
        {
          "handler": {
            "method": "handle",
            "module": "#controllers/home_controller",
            "type": "controller",
          },
          "method": "GET",
          "name": "home",
          "pattern": "/home",
        },
        {
          "handler": {
            "method": "handle",
            "module": "AboutController",
            "type": "controller",
          },
          "method": "GET",
          "middleware": [
            "closure",
          ],
          "name": "about",
          "pattern": "/about",
        },
        {
          "handler": {
            "method": "store",
            "module": "#controllers/contacts_controller",
            "type": "controller",
          },
          "method": "POST",
          "name": "contact.store",
          "pattern": "/contact",
        },
        {
          "handler": {
            "method": "create",
            "module": "#controllers/contacts_controller",
            "type": "controller",
          },
          "method": "GET",
          "name": "contact.create",
          "pattern": "/contact",
        },
        {
          "handler": {
            "method": "handle",
            "module": "UsersController",
            "type": "controller",
          },
          "method": "GET",
          "middleware": [
            "auth",
            "canViewUsers",
            "closure",
          ],
          "name": "users",
          "pattern": "/users",
        },
        {
          "handler": {
            "method": "index",
            "module": "#controllers/payments_controller",
            "type": "controller",
          },
          "method": "GET",
          "middleware": [
            "auth",
            "acl",
            "signed",
            "throttle",
          ],
          "pattern": "/payments",
        },
        {
          "handler": {
            "args": "/articles",
            "name": "redirectsToRoute",
            "type": "redirect",
          },
          "method": "GET",
          "pattern": "/blog",
        },
        {
          "domain": "blog.adonisjs.com",
          "handler": {
            "method": "index",
            "module": "#controllers/articles_controller",
            "type": "controller",
          },
          "method": "GET",
          "name": "articles",
          "pattern": "/articles",
        },
        {
          "domain": "blog.adonisjs.com",
          "handler": {
            "method": "show",
            "module": "#controllers/articles_controller",
            "type": "controller",
          },
          "method": "GET",
          "name": "articles.show",
          "pattern": "/articles/:id/:slug?",
        },
      ]
    `)
  })

  test('each line is valid JSON', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(router, createAceKernel(app).ui, {}, {})
    const lines = await formatter.formatAsJSONL()

    for (const line of lines) {
      assert.doesNotThrow(() => JSON.parse(line))
    }
  })

  test('omits name, domain, and middleware when empty or default', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(router, createAceKernel(app).ui, {}, {})
    const lines = await formatter.formatAsJSONL()

    /**
     * The root closure route "/" has no name, no middleware, and root domain.
     * None of those keys should be present.
     */
    const rootRoute = JSON.parse(lines[0])
    assert.notProperty(rootRoute, 'name')
    assert.notProperty(rootRoute, 'domain')
    assert.notProperty(rootRoute, 'middleware')
  })

  test('includes domain for non-root routes', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(router, createAceKernel(app).ui, {}, {})
    const lines = await formatter.formatAsJSONL()
    const parsed = lines.map((line) => JSON.parse(line))

    const domainRoutes = parsed.filter((r) => r.domain === 'blog.adonisjs.com')
    assert.lengthOf(domainRoutes, 2)
  })

  test('respects filters', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      { middleware: ['auth'] }
    )
    const lines = await formatter.formatAsJSONL()
    const parsed = lines.map((line) => JSON.parse(line))

    assert.isTrue(parsed.every((r) => r.middleware && r.middleware.includes('auth')))
  })
})

test.group('Formatters | List routes | filters', () => {
  test('show routes that has one or more middleware', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['*'],
      }
    )

    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "AboutController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "about",
              "pattern": "/about",
            },
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/payments_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "#middleware/acl_middleware",
                  "name": "acl",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "signed",
                  "name": "signed",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "throttle",
                  "name": "throttle",
                  "type": "named",
                },
              ],
              "name": "",
              "pattern": "/payments",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [],
        },
      ]
    `)
  })

  test('show routes that has zero middleware', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        ignoreMiddleware: ['*'],
      }
    )

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: '',
            pattern: '/',
            methods: ['GET'],
            handler: {
              type: 'closure',
              name: 'closure',
              args: undefined,
            },
            middleware: [],
          },
          {
            name: '',
            pattern: '/files/:directory/*',
            methods: ['GET'],
            handler: {
              type: 'closure',
              name: 'closure',
              args: undefined,
            },
            middleware: [],
          },
          {
            name: 'home',
            pattern: '/home',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/home_controller',
              method: 'handle',
            },
            middleware: [],
          },
          {
            name: 'contact.store',
            pattern: '/contact',
            methods: ['POST'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'store',
            },
            middleware: [],
          },
          {
            name: 'contact.create',
            pattern: '/contact',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'create',
            },
            middleware: [],
          },
          {
            handler: {
              args: '/articles',
              name: 'redirectsToRoute',
              type: 'closure',
            },
            methods: ['GET'],
            middleware: [],
            name: '',
            pattern: '/blog',
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [
          {
            pattern: '/articles',
            name: 'articles',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/articles_controller',
              method: 'index',
            },
            middleware: [],
          },
          {
            pattern: '/articles/:id/:slug?',
            name: 'articles.show',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/articles_controller',
              method: 'show',
            },
            middleware: [],
          },
        ],
      },
    ])
  })

  test('show routes that has specific middleware', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['auth'],
      }
    )

    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
            {
              "handler": {
                "method": "index",
                "moduleNameOrPath": "#controllers/payments_controller",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "#middleware/acl_middleware",
                  "name": "acl",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "signed",
                  "name": "signed",
                  "type": "named",
                },
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "throttle",
                  "name": "throttle",
                  "type": "named",
                },
              ],
              "name": "",
              "pattern": "/payments",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [],
        },
      ]
    `)
  })

  test('combine middleware and ignoreMiddleware filters', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['auth'],
        ignoreMiddleware: ['acl'],
      }
    )

    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [],
        },
      ]
    `)
  })

  test('show routes by controller name', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['auth'],
        match: 'UsersController',
      }
    )

    assert.snapshot(await formatter.formatAsJSON()).matchInline(`
      [
        {
          "domain": "root",
          "routes": [
            {
              "handler": {
                "method": "handle",
                "moduleNameOrPath": "UsersController",
                "type": "controller",
              },
              "methods": [
                "GET",
              ],
              "middleware": [
                {
                  "args": undefined,
                  "method": "handle",
                  "moduleNameOrPath": "auth",
                  "name": "auth",
                  "type": "named",
                },
                {
                  "name": "canViewUsers",
                  "type": "closure",
                },
                {
                  "name": "closure",
                  "type": "closure",
                },
              ],
              "name": "users",
              "pattern": "/users",
            },
          ],
        },
        {
          "domain": "blog.adonisjs.com",
          "routes": [],
        },
      ]
    `)
  })

  test('show routes by route name', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['auth'],
        match: 'contact.',
      }
    )

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: 'contact.store',
            pattern: '/contact',
            methods: ['POST'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'store',
            },
            middleware: [],
          },
          {
            name: 'contact.create',
            pattern: '/contact',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'create',
            },
            middleware: [],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
  })

  test('show routes by pattern name', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .create(fs.baseUrl)

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()
    await registerRoutes(app)

    const router = await app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      createAceKernel(app).ui,
      {},
      {
        middleware: ['auth'],
        match: '/contact',
      }
    )

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: 'contact.store',
            pattern: '/contact',
            methods: ['POST'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'store',
            },
            middleware: [],
          },
          {
            name: 'contact.create',
            pattern: '/contact',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'create',
            },
            middleware: [],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
  })
})
