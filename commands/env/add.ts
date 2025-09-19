/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type CommandOptions } from '../../types/ace.ts'
import stringHelpers from '../../src/helpers/string.ts'
import { args, BaseCommand, flags } from '../../modules/ace/main.ts'

const ALLOWED_TYPES = ['string', 'boolean', 'number', 'enum'] as const
type AllowedTypes = (typeof ALLOWED_TYPES)[number]

/**
 * Command to add a new environment variable to the application.
 * Updates .env, .env.example, and start/env.ts files with the new variable,
 * including appropriate validation schema based on the variable type.
 *
 * @example
 * ```
 * ace env:add
 * ace env:add DATABASE_URL postgres://localhost:5432/mydb
 * ace env:add API_KEY secret --type=string
 * ace env:add PORT 3333 --type=number
 * ace env:add DEBUG true --type=boolean
 * ace env:add LOG_LEVEL info --type=enum --enum-values=debug,info,warn,error
 * ```
 */
export default class EnvAdd extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'env:add'

  /**
   * The command description
   */
  static description = 'Add a new environment variable'

  /**
   * Command options configuration.
   * Allows unknown flags to be passed through.
   */
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * Environment variable name (will be converted to SCREAMING_SNAKE_CASE)
   */
  @args.string({
    description: 'Variable name. Will be converted to screaming snake case',
    required: false,
  })
  declare name: string

  /**
   * Environment variable value
   */
  @args.string({ description: 'Variable value', required: false })
  declare value: string

  /**
   * Data type of the environment variable (string, boolean, number, enum)
   */
  @flags.string({ description: 'Type of the variable' })
  declare type: AllowedTypes

  /**
   * Allowed values for enum type variables
   */
  @flags.array({
    description: 'Allowed values for the enum type in a comma-separated list',
    default: [''],
    required: false,
  })
  declare enumValues: string[]

  /**
   * Validate that the provided type is one of the allowed types.
   *
   * @returns True if the type is valid, false otherwise
   */
  #isTypeFlagValid() {
    return ALLOWED_TYPES.includes(this.type)
  }

  /**
   * Execute the command to add a new environment variable.
   * Prompts for missing values, validates inputs, and updates all relevant files.
   */
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
      { omitFromExample: [transformedName] }
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
