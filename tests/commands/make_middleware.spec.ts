/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AceFactory } from '../../factories/core/ace.js'
import { StubsFactory } from '../../factories/stubs.js'
import MakeMiddleware from '../../commands/make/middleware.js'

test.group('Make middleware', (group) => {
  group.tap((t) => t.disableTimeout())

  test('create middleware class', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('start/kernel.ts', 'server.use([])')

    const command = await ace.create(MakeMiddleware, ['auth', '--stack=server'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/middleware/main.stub', {
      entity: ace.app.generators.createEntity('auth'),
    })

    await assert.fileEquals('app/middleware/auth_middleware.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/middleware/auth_middleware.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update start/kernel.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains(
      'start/kernel.ts',
      `server.use([() => import('#middleware/auth_middleware')])`
    )
  })

  test('register middleware under named stack', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('start/kernel.ts', 'export const middleware = router.named({})')

    const command = await ace.create(MakeMiddleware, ['auth', '--stack=named'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/middleware/main.stub', {
      entity: ace.app.generators.createEntity('auth'),
    })

    await assert.fileEquals('app/middleware/auth_middleware.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/middleware/auth_middleware.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update start/kernel.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains(
      'start/kernel.ts',
      `auth: () => import('#middleware/auth_middleware')`
    )
  })

  test('create nested middleware', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('start/kernel.ts', 'export const middleware = router.named({})')

    const command = await ace.create(MakeMiddleware, ['blog/auth', '--stack=named'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/middleware/main.stub', {
      entity: ace.app.generators.createEntity('auth'),
    })

    await assert.fileEquals('app/middleware/blog/auth_middleware.ts', contents)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create app/middleware/blog/auth_middleware.ts',
        stream: 'stdout',
      },
      {
        message: 'green(DONE:)    update start/kernel.ts file',
        stream: 'stdout',
      },
    ])

    await assert.fileContains(
      'start/kernel.ts',
      `auth: () => import('#middleware/blog/auth_middleware')`
    )
  })

  test('show error when selected middleware stack is invalid', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.createJson('tsconfig.json', {})
    await fs.create('start/kernel.ts', 'export const middleware = router.named({})')

    const command = await ace.create(MakeMiddleware, ['auth', '--stack=foo'])
    await command.exec()
    await assert.fileNotExists('app/middleware/auth_middleware.ts')

    command.assertFailed()
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ red(error) ] Invalid middleware stack "foo". Select from "server, router, named"',
        stream: 'stderr',
      },
    ])
  })
})
