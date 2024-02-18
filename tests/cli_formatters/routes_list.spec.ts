/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import type { ApplicationService } from '../../src/types.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'
import { createAceKernel } from '../../modules/ace/create_kernel.js'
import { RoutesListFormatter } from '../../src/cli_formatters/routes_list.js'

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
            name: 'about',
            pattern: '/about',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'AboutController',
              method: 'handle',
            },
            middleware: ['closure'],
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
            name: '',
            pattern: '/users',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
          {
            name: '',
            pattern: '/payments',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/payments_controller',
              method: 'index',
            },
            middleware: ['auth', 'acl', 'signed', 'throttle'],
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
    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: '',
            pattern: '/',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'closure',
              name: 'closure',
            },
            middleware: [],
          },
          {
            name: '',
            pattern: '/files/:directory/*',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'closure',
              name: 'closure',
            },
            middleware: [],
          },
          {
            name: 'home',
            pattern: '/home',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/home_controller',
              method: 'handle',
            },
            middleware: [],
          },
          {
            name: 'about',
            pattern: '/about',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'AboutController',
              method: 'handle',
            },
            middleware: ['closure'],
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
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/contacts_controller',
              method: 'create',
            },
            middleware: [],
          },
          {
            name: '',
            pattern: '/users',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
          {
            name: '',
            pattern: '/payments',
            methods: ['GET', 'HEAD'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/payments_controller',
              method: 'index',
            },
            middleware: ['auth', 'acl', 'signed', 'throttle'],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [
          {
            pattern: '/articles',
            name: 'articles',
            methods: ['GET', 'HEAD'],
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
            methods: ['GET', 'HEAD'],
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
          `GET    /users ................................... UsersController.handle auth, canViewUsers, closure`,
          `GET    /payments ................ #controllers/payments_controller.index       auth, acl, and 2 more`,
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
        message: `dim(GET)|/home dim((home)) | #controllers/home_controller.cyan(handle)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/about dim((about)) | AboutController.cyan(handle)|dim(closure)`,
        stream: 'stdout',
      },
      {
        message: `dim(POST)|/contact dim((contact.store)) | #controllers/contacts_controller.cyan(store)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/contact dim((contact.create)) | #controllers/contacts_controller.cyan(create)|dim()`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/users | UsersController.cyan(handle)|dim(auth, canViewUsers, closure)`,
        stream: 'stdout',
      },
      {
        message: `dim(GET)|/payments | #controllers/payments_controller.cyan(index)|dim(auth, acl, signed, throttle)`,
        stream: 'stdout',
      },
    ])
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

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: 'about',
            pattern: '/about',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'AboutController',
              method: 'handle',
            },
            middleware: ['closure'],
          },
          {
            name: '',
            pattern: '/users',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
          {
            name: '',
            pattern: '/payments',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/payments_controller',
              method: 'index',
            },
            middleware: ['auth', 'acl', 'signed', 'throttle'],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
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

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: '',
            pattern: '/users',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
          {
            name: '',
            pattern: '/payments',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: '#controllers/payments_controller',
              method: 'index',
            },
            middleware: ['auth', 'acl', 'signed', 'throttle'],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
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

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: '',
            pattern: '/users',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
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

    assert.deepEqual(await formatter.formatAsJSON(), [
      {
        domain: 'root',
        routes: [
          {
            name: '',
            pattern: '/users',
            methods: ['GET'],
            handler: {
              type: 'controller',
              moduleNameOrPath: 'UsersController',
              method: 'handle',
            },
            middleware: ['auth', 'canViewUsers', 'closure'],
          },
        ],
      },
      {
        domain: 'blog.adonisjs.com',
        routes: [],
      },
    ])
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
