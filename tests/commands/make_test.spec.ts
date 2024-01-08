/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import MakeTest from '../../commands/make/test.js'
import { StubsFactory } from '../../factories/stubs.js'
import { AceFactory } from '../../factories/core/ace.js'
import { IgnitorFactory } from '../../factories/core/ignitor.js'

test.group('Make test', () => {
  test('--suite flag: make inside suite directory', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
          tests: {
            suites: [
              {
                name: 'functional',
                files: ['tests/functional/**/*.spec.ts'],
              },
            ],
          },
        },
      })
      .create(fs.baseUrl)

    const ace = await new AceFactory().make(ignitor)
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTest, ['posts/create', '--suite', 'functional'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/test/main.stub', {
      entity: ace.app.generators.createEntity('posts/create'),
      suite: {
        directory: 'tests/functional',
      },
    })

    await assert.fileEquals('tests/functional/posts/create.spec.ts', contents)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create tests/functional/posts/create.spec.ts',
        stream: 'stdout',
      },
    ])
  })

  test('--suite flag: show error when mentioned suite does not exists', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
        },
      })
      .withCoreConfig()
      .create(fs.baseUrl)

    const ace = await new AceFactory().make(ignitor)
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTest, ['posts/create', '--suite', 'functional'])
    await command.exec()

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ red(error) ] The "functional" suite is not configured inside the "adonisrc.js" file',
        stream: 'stderr',
      },
    ])
  })

  test('auto pick first suite when only one suite is configured in rcfile', async ({
    assert,
    fs,
  }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
          tests: {
            suites: [
              {
                name: 'functional',
                files: ['tests/functional/**/*.spec.ts'],
              },
            ],
          },
        },
      })
      .create(fs.baseUrl)

    const ace = await new AceFactory().make(ignitor)
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTest, ['posts/create'])
    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/test/main.stub', {
      entity: ace.app.generators.createEntity('posts/create'),
      suite: {
        directory: 'tests/functional',
      },
    })

    await assert.fileEquals('tests/functional/posts/create.spec.ts', contents)
    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create tests/functional/posts/create.spec.ts',
        stream: 'stdout',
      },
    ])
  })

  test('prompt for suite selection when multiple suites are configured in rc file', async ({
    assert,
    fs,
  }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
          tests: {
            suites: [
              {
                name: 'functional',
                files: ['tests/functional/**/*.spec.ts'],
              },
              {
                name: 'unit',
                files: ['tests/unit/**/*.spec.ts'],
              },
            ],
          },
        },
      })
      .create(fs.baseUrl)

    const ace = await new AceFactory().make(ignitor)
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTest, ['posts/create'])
    command.prompt
      .trap('Select the suite for the test file')
      .assertFails('', 'Please select a suite')
      .assertPasses('functional')
      .chooseOption(1)

    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/test/main.stub', {
      entity: ace.app.generators.createEntity('posts/create'),
      suite: {
        directory: 'tests/unit',
      },
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create tests/unit/posts/create.spec.ts',
        stream: 'stdout',
      },
    ])
    await assert.fileEquals('tests/unit/posts/create.spec.ts', contents)
  })

  test('prompt for directory selection when suite has multiple directories', async ({
    assert,
    fs,
  }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/app_provider.js')],
          tests: {
            suites: [
              {
                name: 'functional',
                files: ['tests/functional/**/*.spec.ts', 'features/tests/functional/*.spec.ts'],
              },
            ],
          },
        },
      })
      .create(fs.baseUrl)

    const ace = await new AceFactory().make(ignitor)
    ace.ui.switchMode('raw')

    const command = await ace.create(MakeTest, ['posts/create'])
    command.prompt
      .trap('Select directory for the test file')
      .assertPasses('features/tests/functional')
      .assertFails('', 'Please select a directory')
      .chooseOption(1)

    await command.exec()

    const { contents } = await new StubsFactory().prepare('make/test/main.stub', {
      entity: ace.app.generators.createEntity('posts/create'),
      suite: {
        directory: 'features/tests/functional',
      },
    })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message: 'green(DONE:)    create features/tests/functional/posts/create.spec.ts',
        stream: 'stdout',
      },
    ])
    await assert.fileEquals('features/tests/functional/posts/create.spec.ts', contents)
  })
})
