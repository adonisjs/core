/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { slash } from '@poppinss/utils'
import type { Logger } from '@poppinss/cliui'
import { EnvEditor } from '@adonisjs/env/editor'
import type { CodeTransformer } from '@adonisjs/assembler/code_transformer'
import type { AddMiddlewareEntry, EnvValidationDefinition } from '@adonisjs/assembler/types'
import type { Application } from '../app.js'

/**
 * Codemods to modify AdonisJS source files. The codemod APIs relies on
 * "@adonisjs/assembler" package and it must be installed as a dependency
 * inside user application.
 */
export class Codemods {
  /**
   * Flag to know if assembler is installed as a
   * peer dependency or not.
   */
  #isAssemblerInstalled?: boolean

  /**
   * Reference to lazily imported assembler code transformer
   */
  #codeTransformer?: typeof import('@adonisjs/assembler/code_transformer')

  /**
   * Reference to AdonisJS application
   */
  #app: Application<any>

  /**
   * Reference to CLI logger to write logs
   */
  #cliLogger: Logger

  constructor(app: Application<any>, cliLogger: Logger) {
    this.#app = app
    this.#cliLogger = cliLogger
  }

  /**
   * Lazily imports assembler
   */
  async #importAssembler() {
    if (this.#isAssemblerInstalled === undefined) {
      this.#codeTransformer = await import('@adonisjs/assembler/code_transformer')
      this.#isAssemblerInstalled = !!this.#codeTransformer
    }
  }

  /**
   * Define one or more environment variables
   */
  async defineEnvVariables(environmentVariables: Record<string, number | string | boolean>) {
    const editor = new EnvEditor(this.#app.appRoot)
    await editor.load()

    Object.keys(environmentVariables).forEach((key) => {
      const value = environmentVariables[key]
      editor.add(key, value)
    })

    await editor.save()
    this.#cliLogger.action('update .env file').succeeded()
  }

  /**
   * Define validations for the environment variables
   */
  async defineEnvValidations(validations: EnvValidationDefinition) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "start/env.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update start/env.ts file')

    try {
      await transformer.defineEnvValidations(validations)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Define validations for the environment variables
   */
  async registerMiddleware(stack: 'server' | 'router' | 'named', middleware: AddMiddlewareEntry[]) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "start/kernel.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update start/kernel.ts file')

    try {
      await transformer.addMiddlewareToStack(stack, middleware)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Update RCFile
   */
  async updateRcFile(...params: Parameters<CodeTransformer['updateRcFile']>) {
    await this.#importAssembler()
    if (!this.#codeTransformer) {
      this.#cliLogger.warning(
        'Cannot update "adonisrc.ts" file. Install "@adonisjs/assembler" to modify source files'
      )
      return
    }

    const transformer = new this.#codeTransformer.CodeTransformer(this.#app.appRoot)
    const action = this.#cliLogger.action('update adonisrc.ts file')
    try {
      await transformer.updateRcFile(...params)
      action.succeeded()
    } catch (error) {
      action.failed(error.message)
    }
  }

  /**
   * Generats the stub
   */
  async makeUsingStub(stubsRoot: string, stubPath: string, stubState: Record<string, any>) {
    const stubs = await this.#app.stubs.create()
    const stub = await stubs.build(stubPath, { source: stubsRoot })
    const output = await stub.generate(stubState)

    const entityFileName = slash(this.#app.relativePath(output.destination))
    const result = { ...output, relativeFileName: entityFileName }

    if (output.status === 'skipped') {
      this.#cliLogger.action(`create ${entityFileName}`).skipped(output.skipReason)
      return result
    }

    this.#cliLogger.action(`create ${entityFileName}`).succeeded()
    return result
  }
}
