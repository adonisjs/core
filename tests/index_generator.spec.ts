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

    indexer.run({} as any, generator)
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
        .find(({ message }) => message.includes('.adonisjs/server/controllers.ts'))
    )
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

    indexer.run({} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/server/events.ts')
    await assert.fileContains('.adonisjs/server/events.ts', [
      `export const events = {`,
      `UserRegistered: () => import('#events/user_registered')`,
      `InvoiceCreated: () => import('#events/billing/invoice_created')`,
    ])
    assert.isDefined(
      cliUi.logger.getLogs().find(({ message }) => message.includes('.adonisjs/server/events.ts'))
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

    indexer.run({} as any, generator)
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
        .find(({ message }) => message.includes('.adonisjs/server/listeners.ts'))
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

    indexer.run({} as any, generator)
    await generator.generate()

    await assert.fileExists('.adonisjs/client/data.d.ts')
    await assert.fileContains('.adonisjs/client/data.d.ts', [
      `import { InferData } from '@adonisjs/core/types/transformers'`,
      `import BlogPostTransformer from '#transformers/blog/post_transformer'`,
      `import UserTransformer from '#transformers/user_transformer'`,
      `export namespace Data {`,
      `export type Post = InferData<BlogPostTransformer>`,
      `export namespace Blog {`,
      `export type User = InferData<UserTransformer>`,
    ])
    assert.isDefined(
      cliUi.logger.getLogs().find(({ message }) => message.includes('.adonisjs/client/data.d.ts'))
    )
  })
})
