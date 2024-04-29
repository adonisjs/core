/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { CommandOptions } from '../../types/ace.js'
import stringHelpers from '../../src/helpers/string.js'
import { args, BaseCommand, flags } from '../../modules/ace/main.js'

const ALLOWED_TYPES = ['string', 'boolean', 'number', 'enum'] as const
type AllowedTypes = (typeof ALLOWED_TYPES)[number]

/**
 * The env:add command is used to add a new environment variable to the
 * `.env`, `.env.example` and `start/env.ts` files.
 */
export default class EnvAdd extends BaseCommand {
  static commandName = 'env:add'
  static description = 'Add a new environment variable'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  @args.string({
    description: 'Variable name. Will be converted to screaming snake case',
    required: false,
  })
  declare name: string

  @args.string({ description: 'Variable value', required: false })
  declare value: string

  @flags.string({ description: 'Type of the variable' })
  declare type: AllowedTypes

  @flags.array({
    description: 'Allowed values for the enum type in a comma-separated list',
    default: [''],
    required: false,
  })
  declare enumValues: string[]

  /**
   * Validate the type flag passed by the user
   */
  #isTypeFlagValid() {
    return ALLOWED_TYPES.includes(this.type)
  }

  async run() {
    /**
     * Prompt for missing name
     */
    if (!this.name) {
      this.name = await this.prompt.ask('Enter the variable name', {
        validate: (value) => !!value,
        format: (value) => stringHelpers.snakeCase(value).toUpperCase(),
      })
    }

    /**
     * Prompt for missing value
     */
    if (!this.value) {
      this.value = await this.prompt.ask('Enter the variable value')
    }

    /**
     * Prompt for missing type
     */
    if (!this.type) {
      this.type = await this.prompt.choice('Select the variable type', ALLOWED_TYPES)
    }

    /**
     * Prompt for missing enum values if the selected env type is `enum`
     */
    if (this.type === 'enum' && !this.enumValues) {
      this.enumValues = await this.prompt.ask('Enter the enum values separated by a comma', {
        result: (value) => value.split(',').map((one) => one.trim()),
      })
    }

    /**
     * Validate inputs
     */
    if (!this.#isTypeFlagValid()) {
      this.logger.error(`Invalid type "${this.type}". Must be one of ${ALLOWED_TYPES.join(', ')}`)
      return
    }

    /**
     * Add the environment variable to the `.env` and `.env.example` files
     */
    const codemods = await this.createCodemods()
    const transformedName = stringHelpers.snakeCase(this.name).toUpperCase()
    await codemods.defineEnvVariables(
      { [transformedName]: this.value },
      { withEmptyExampleValue: true }
    )

    /**
     * Add the environment variable to the `start/env.ts` file
     */
    const validation = {
      string: 'Env.schema.string()',
      number: 'Env.schema.number()',
      boolean: 'Env.schema.boolean()',
      enum: `Env.schema.enum(['${this.enumValues.join("','")}'] as const)`,
    }[this.type]

    await codemods.defineEnvValidations({ variables: { [transformedName]: validation } })

    this.logger.success('Environment variable added successfully')
  }
}
