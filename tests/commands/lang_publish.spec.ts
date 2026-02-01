import { test } from '@japa/runner'
import { AceFactory } from '../../factories/core/ace.js'
import LangPublishCommand from '../../commands/lang/publish.js'

test.group('Lang publish', () => {
  test('publish validator messages', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    const command = await ace.create(LangPublishCommand, [])
    await command.exec()

    await assert.fileExists('resources/lang/en/validator.json')
    const json = await fs.contentsJson('resources/lang/en/validator.json')
    assert.isObject(json.shared)
    assert.isObject(json.shared.messages)
    assert.isTrue(Object.keys(json.shared.messages).length > 0)

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ green(success) ] Localization template published to resources/lang/en/validator.json',
        stream: 'stdout',
      },
    ])
  })

  test('skip when validator messages file already exists', async ({ assert, fs }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create('resources/lang/en/validator.json', JSON.stringify({ old: true }))

    const command = await ace.create(LangPublishCommand, [])
    await command.exec()

    const json = await fs.contentsJson('resources/lang/en/validator.json')
    assert.deepEqual(json, { old: true })

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ red(error) ] File "resources/lang/en/validator.json" already exists. Use "--merge" flag to update the file',
        stream: 'stderr',
      },
    ])
  })

  test('merge when validator messages file already exists and --merge is used', async ({
    assert,
    fs,
  }) => {
    const ace = await new AceFactory().make(fs.baseUrl)
    await ace.app.init()
    ace.ui.switchMode('raw')

    await fs.create(
      'resources/lang/en/validator.json',
      JSON.stringify({
        shared: { messages: { required: 'foo' } },
        other: true,
      })
    )

    const command = await ace.create(LangPublishCommand, ['--merge'])
    await command.exec()

    const json = await fs.contentsJson('resources/lang/en/validator.json')
    assert.property(json, 'other')
    // Existing message should be preserved/override vine message if same key,
    // OR vine message merged?
    // Code says: ...messages, ...validatorMessages.shared?.messages
    // So existing messages (validatorMessages.shared.messages) take precedence over vine (messages).
    assert.equal(json.shared.messages.required, 'foo')

    assert.deepEqual(ace.ui.logger.getLogs(), [
      {
        message:
          '[ green(success) ] Localization template published to resources/lang/en/validator.json',
        stream: 'stdout',
      },
    ])
  })
})
