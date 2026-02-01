/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '../../modules/ace/main.js'
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/**
 * Publish localization templates
 */
export default class MakeCommand extends BaseCommand {
  static commandName = 'lang:publish'
  static description = 'Eject localization templates to resources/lang/en directory'

  @flags.boolean({ description: 'Merge with existing "validator.json" file' })
  declare merge?: boolean

  async run() {
    let messages: any = {}
    try {
      const vine = await import('@vinejs/vine/defaults')
      messages = vine.messages
    } catch {
      this.exitCode = 1
      this.logger.error('Vine is not installed. No localization templates to publish.')
      return
    }

    const destination = this.app.languageFilesPath('en', 'validator.json')

    if (existsSync(destination) && !this.merge) {
      this.exitCode = 1
      this.logger.error(
        'File "resources/lang/en/validator.json" already exists. Use "--merge" flag to update the file'
      )
      return
    }

    let validatorMessages = {
      shared: {
        messages: {},
      },
    }

    if (existsSync(destination)) {
      try {
        validatorMessages = JSON.parse(await readFile(destination, 'utf-8'))
      } catch {
        this.exitCode = 1
        this.logger.error(
          'Failed to parse existing validator.json. Overwriting with default contents.'
        )
        return
      }
    }

    validatorMessages = {
      ...validatorMessages,
      shared: {
        ...validatorMessages.shared,
        messages: {
          ...messages,
          ...validatorMessages.shared?.messages,
        },
      },
    }

    await writeFile(destination, JSON.stringify(validatorMessages, null, 2))

    this.logger.success('Localization template published to resources/lang/en/validator.json')
  }
}
