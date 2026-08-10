/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Kernel } from '@adonisjs/ace'
import { IndexGenerator } from '@adonisjs/assembler/index_generator'

import stringHelpers from '../src/helpers/string.ts'
import { indexEntities } from '../src/assembler_hooks/index_entities.ts'

test.group('Index generator', () => {
  test('generate controllers index', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/controllers/users_controller.ts', '')
    await fs.create('app/controllers/blog/posts_controller.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: true,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: false,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/server/controllers.ts')
    await assert.fileContains('.adonisjs/server/controllers.ts', [
      `export const controllers = {`,
      `Users: () => import('#controllers/users_controller')`,
      `Posts: () => import('#controllers/blog/posts_controller')`,
    ])
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate controllers index from the configured directory', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('src/infrastructure/api/http/controllers/users_controller.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: true,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: false,
      },
    })

    indexer.run(
      {
        options: {
          directories: {
            httpControllers: 'src/infrastructure/api/http/controllers',
          },
        },
      } as any,
      {} as any,
      generator
    )
    await generator.generate()

    await assert.fileContains('.adonisjs/server/controllers.ts', [
      `Users: () => import('#controllers/users_controller')`,
    ])
  })

  test('generate events index', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/events/user_registered.ts', '')
    await fs.create('app/events/billing/invoice_created.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: true,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: false,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/server/events.ts')
    await assert.fileContains('.adonisjs/server/events.ts', [
      `import BillingInvoiceCreated from '#events/billing/invoice_created'`,
      `import UserRegistered from '#events/user_registered'`,
      `export const events = {`,
      `UserRegistered: UserRegistered`,
      `InvoiceCreated: BillingInvoiceCreated`,
    ])
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate listeners index', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/listeners/send_welcome_email.ts', '')
    await fs.create('app/listeners/billing/send_invoice.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: true,
      },
      transformers: {
        enabled: false,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/server/listeners.ts')
    await assert.fileContains('.adonisjs/server/listeners.ts', [
      `export const listeners = {`,
      `SendWelcomeEmail: () => import('#listeners/send_welcome_email')`,
      `SendInvoice: () => import('#listeners/billing/send_invoice')`,
    ])
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate transformers index', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/transformers/user_transformer.ts', '')
    await fs.create('app/transformers/blog/post_transformer.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: true,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/data.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"./manifest.d.ts\\" />
      import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'
      import type BlogPostTransformer from '#transformers/blog/post_transformer'
      import type UserTransformer from '#transformers/user_transformer'

      export namespace Data {
        export namespace Blog {
          export type Post = InferData<BlogPostTransformer>
          export namespace Post {
            export type Variants = InferVariants<BlogPostTransformer>
          }
        }
        export type User = InferData<UserTransformer>
        export namespace User {
          export type Variants = InferVariants<UserTransformer>
        }
      }
      "
    `)
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate transformers index with shared props', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/transformers/user_transformer.ts', '')
    await fs.create('app/transformers/blog/post_transformer.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: true,
        withSharedProps: true,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/data.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"./manifest.d.ts\\" />
      import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'
      import type { InferSharedProps, InferFlashData } from '@adonisjs/inertia/types'
      import type BlogPostTransformer from '#transformers/blog/post_transformer'
      import type UserTransformer from '#transformers/user_transformer'
      import type InertiaMiddleware from '#middleware/inertia_middleware'

      export namespace Data {
        export namespace Blog {
          export type Post = InferData<BlogPostTransformer>
          export namespace Post {
            export type Variants = InferVariants<BlogPostTransformer>
          }
        }
        export type User = InferData<UserTransformer>
        export namespace User {
          export type Variants = InferVariants<UserTransformer>
        }
        export type SharedProps = InferSharedProps<InertiaMiddleware>
        export type FlashMessages = InferFlashData<InertiaMiddleware>
      }
      "
    `)
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate transformers index with shared props and custom inertia middleware import path', async ({
    assert,
    fs,
  }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/transformers/user_transformer.ts', '')
    await fs.create('app/transformers/blog/post_transformer.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: true,
        withSharedProps: true,
        inertiaMiddlewareImportPath: '#core/middleware/inertia_middleware',
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/data.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"./manifest.d.ts\\" />
      import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'
      import type { InferSharedProps, InferFlashData } from '@adonisjs/inertia/types'
      import type BlogPostTransformer from '#transformers/blog/post_transformer'
      import type UserTransformer from '#transformers/user_transformer'
      import type InertiaMiddleware from '#core/middleware/inertia_middleware'

      export namespace Data {
        export namespace Blog {
          export type Post = InferData<BlogPostTransformer>
          export namespace Post {
            export type Variants = InferVariants<BlogPostTransformer>
          }
        }
        export type User = InferData<UserTransformer>
        export namespace User {
          export type Variants = InferVariants<UserTransformer>
        }
        export type SharedProps = InferSharedProps<InertiaMiddleware>
        export type FlashMessages = InferFlashData<InertiaMiddleware>
      }
      "
    `)
    assert.isDefined(
      cliUi.logger
        .getLogs()
        .find(({ message }) => message.includes('[ blue(info) ] codegen: created'))
    )
  })

  test('generate transformers index with deeply nested directories', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/transformers/identity/auth/login_transformer.ts', '')
    await fs.create('app/transformers/billing/invoices/invoice_transformer.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: true,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/data.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"./manifest.d.ts\\" />
      import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'
      import type BillingInvoicesInvoiceTransformer from '#transformers/billing/invoices/invoice_transformer'
      import type IdentityAuthLoginTransformer from '#transformers/identity/auth/login_transformer'

      export namespace Data {
        export namespace Billing {
          export namespace Invoices {
            export type Invoice = InferData<BillingInvoicesInvoiceTransformer>
            export namespace Invoice {
              export type Variants = InferVariants<BillingInvoicesInvoiceTransformer>
            }
          }
        }
        export namespace Identity {
          export namespace Auth {
            export type Login = InferData<IdentityAuthLoginTransformer>
            export namespace Login {
              export type Variants = InferVariants<IdentityAuthLoginTransformer>
            }
          }
        }
      }
      "
    `)
  })

  test('skip segments from controllers index with module-based folder structure', async ({
    assert,
    fs,
  }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/identity/controllers/auth_controller.ts', '')
    await fs.create('app/identity/controllers/users_controller.ts', '')
    await fs.create('app/billing/controllers/invoices_controller.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: true,
        source: 'app',
        glob: ['**/controllers/*_controller.ts'],
        importAlias: '#app',
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: false,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/server/controllers.ts')
    assert.snapshot(await fs.contents('.adonisjs/server/controllers.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      export const controllers = {
        billing: {
          Invoices: () => import('#app/billing/controllers/invoices_controller'),
        },
        identity: {
          Auth: () => import('#app/identity/controllers/auth_controller'),
          Users: () => import('#app/identity/controllers/users_controller'),
        },
      }
      "
    `)
    await assert.fileNotContains('.adonisjs/server/controllers.ts', [`controllers: {`])
  })

  test('skip segments from transformers index with module-based folder structure', async ({
    assert,
    fs,
  }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('app/identity/transformers/user_transformer.ts', '')
    await fs.create('app/billing/transformers/invoice_transformer.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      controllers: {
        enabled: false,
      },
      events: {
        enabled: false,
      },
      listeners: {
        enabled: false,
      },
      transformers: {
        enabled: true,
        source: 'app',
        glob: ['**/transformers/*_transformer.ts'],
        importAlias: '#app',
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/data.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"./manifest.d.ts\\" />
      import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'
      import type BillingInvoiceTransformer from '#app/billing/transformers/invoice_transformer'
      import type IdentityUserTransformer from '#app/identity/transformers/user_transformer'

      export namespace Data {
        export namespace Billing {
          export type Invoice = InferData<BillingInvoiceTransformer>
          export namespace Invoice {
            export type Variants = InferVariants<BillingInvoiceTransformer>
          }
        }
        export namespace Identity {
          export type User = InferData<IdentityUserTransformer>
          export namespace User {
            export type Variants = InferVariants<IdentityUserTransformer>
          }
        }
      }
      "
    `)
  })

  test('generate frontend manifest file', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('config/app.ts', '') // ignored
    await fs.create('config/hash.ts', '')
    await fs.create('config/auth.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      transformers: {
        enabled: true,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/manifest.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/manifest.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"../../adonisrc.ts\\" />
      /// <reference path=\\"../../config/auth.ts\\" />
      /// <reference path=\\"../../config/hash.ts\\" />
      "
    `)
  })

  test('include all files', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('config/app.ts', '')
    await fs.create('config/hash.ts', '')
    await fs.create('config/auth.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      transformers: {
        enabled: true,
      },
      manifest: {
        enabled: true,
        exclude: [],
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/manifest.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/manifest.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"../../adonisrc.ts\\" />
      /// <reference path=\\"../../config/app.ts\\" />
      /// <reference path=\\"../../config/auth.ts\\" />
      /// <reference path=\\"../../config/hash.ts\\" />
      "
    `)
  })

  test('do not generate manifest file when explicitly disabled', async ({ assert, fs }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('config/app.ts', '')
    await fs.create('config/hash.ts', '')
    await fs.create('config/auth.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      transformers: {
        enabled: true,
      },
      manifest: {
        enabled: false,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileNotExists('.adonisjs/client/manifest.d.ts')
  })

  test('generate manifest file when explicitly enable without enabling transformers', async ({
    assert,
    fs,
  }) => {
    const cliUi = Kernel.create().ui
    cliUi.switchMode('raw')

    await fs.create('config/app.ts', '')
    await fs.create('config/hash.ts', '')
    await fs.create('config/auth.ts', '')

    const generator = new IndexGenerator(stringHelpers.toUnixSlash(fs.basePath), cliUi.logger)
    const indexer = indexEntities({
      manifest: {
        enabled: true,
      },
    })

    indexer.run({} as any, {} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/manifest.d.ts')
    assert.snapshot(await fs.contents('.adonisjs/client/manifest.d.ts')).matchInline(`
      "/**
       * This file is automatically generated.
       * DO NOT EDIT manually
       */

      /// <reference path=\\"../../adonisrc.ts\\" />
      /// <reference path=\\"../../config/auth.ts\\" />
      /// <reference path=\\"../../config/hash.ts\\" />
      "
    `)
  })
})
