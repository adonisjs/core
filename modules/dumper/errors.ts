/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { inspect } from 'node:util'
import { parse } from 'error-stack-parser-es'
import { Exception } from '@poppinss/utils/exception'

import type { Dumper } from './dumper.ts'
import type { Kernel } from '../ace/kernel.ts'
import type { HttpContext } from '../http/main.ts'

/**
 * DumpDie exception raised by the "dd" (dump and die) function.
 * This special exception terminates execution while dumping the provided
 * value as HTML (during HTTP requests) or ANSI (in console/CLI).
 *
 * @example
 * ```ts
 * // This will dump the user object and terminate
 * dumper.dd(user)
 *
 * // In HTTP context: sends HTML dump to browser
 * // In CLI context: prints ANSI dump to console
 * ```
 */
class DumpDieException extends Exception {
  static status: number = 500
  static code: string = 'E_DUMP_DIE_EXCEPTION'

  declare fileName: string
  declare lineNumber: number

  #dumper: Dumper
  #traceSourceIndex: number = 1
  value: unknown

  constructor(value: unknown, dumper: Dumper) {
    super('Dump and Die exception')
    this.#dumper = dumper
    this.value = value
  }

  /**
   * Returns the source file and line number location for the error
   */
  #getErrorSource(): { location: string; line: number } | undefined {
    if (this.fileName && this.lineNumber) {
      return {
        location: this.fileName,
        line: this.lineNumber,
      }
    }

    const source = parse(this)[this.#traceSourceIndex]
    if (!source.fileName || !source.lineNumber) {
      return
    }

    return {
      location: source.fileName,
      line: source.lineNumber,
    }
  }

  /**
   * Set the stack trace index for determining the source location.
   * This is useful when building nested helpers on top of dump/die functionality.
   *
   * @param index - Stack trace index (0 = current function, 1 = caller, etc.)
   */
  setTraceSourceIndex(index: number) {
    this.#traceSourceIndex = index
    return this
  }

  /**
   * Preventing itself from getting reported by the
   * AdonisJS exception reporter
   */
  report() {}

  /**
   * HTTP exception handler that renders the dump as HTML output.
   * This method is called automatically by AdonisJS when a DumpDieException
   * is thrown during an HTTP request.
   *
   * @param error - The DumpDieException instance
   * @param ctx - HTTP context for the current request
   */
  async handle(error: DumpDieException, ctx: HttpContext) {
    const source = this.#getErrorSource()

    /**
     * Comes from the shield package
     */
    const cspNonce = 'nonce' in ctx.response ? (ctx.response.nonce as string) : undefined

    ctx.response
      .status(500)
      .send(
        '<!DOCTYPE html>' +
          '<html>' +
          '<head>' +
          '<meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width">' +
          `${this.#dumper.getHeadElements(cspNonce)}` +
          '</head>' +
          '<body>' +
          `${this.#dumper.dumpToHtml(error.value, { cspNonce, source, title: 'DUMP DIE' })}` +
          '</body>' +
          '</html>'
      )
  }

  /**
   * Ace command exception handler that renders the dump as ANSI output.
   * This method is called automatically by the Ace kernel when a DumpDieException
   * is thrown during command execution.
   *
   * @param error - The DumpDieException instance
   * @param kernel - Ace kernel instance
   */
  async render(error: DumpDieException, kernel: Kernel) {
    const source = this.#getErrorSource()
    kernel.ui.logger.log(this.#dumper.dumpToAnsi(error.value, { source, title: 'DUMP DIE' }))
  }

  /**
   * Custom output for the Node.js util inspect
   */
  [inspect.custom]() {
    const source = this.#getErrorSource()
    return this.#dumper.dumpToAnsi(this.value, { source, title: 'DUMP DIE' })
  }
}

export const E_DUMP_DIE_EXCEPTION = DumpDieException
