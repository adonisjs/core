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
import type { Kernel } from '@adonisjs/core/ace'
import { Exception } from '@poppinss/utils/exception'
import type { HttpContext } from '@adonisjs/core/http'
import type { ApplicationService } from '@adonisjs/core/types'

import type { Dumper } from './dumper.js'

const IDE = process.env.ADONIS_IDE ?? process.env.EDITOR ?? ''

/**
 * DumpDie exception is raised by the "dd" function. It will
 * result in dumping the value in response to an HTTP
 * request or printing the value to the console
 */
class DumpDieException extends Exception {
  static status: number = 500
  static code: string = 'E_DUMP_DIE_EXCEPTION'

  #app: ApplicationService
  #dumper: Dumper
  #traceSourceIndex: number = 1

  /**
   * A collections of known editors to create URLs to open
   * them
   */
  #editors: Record<string, string> = {
    textmate: 'txmt://open?url=file://%f&line=%l',
    macvim: 'mvim://open?url=file://%f&line=%l',
    emacs: 'emacs://open?url=file://%f&line=%l',
    sublime: 'subl://open?url=file://%f&line=%l',
    phpstorm: 'phpstorm://open?file=%f&line=%l',
    atom: 'atom://core/open/file?filename=%f&line=%l',
    vscode: 'vscode://file/%f:%l',
  }

  value: unknown

  constructor(value: unknown, dumper: Dumper, app: ApplicationService) {
    super('Dump and Die exception')
    this.#dumper = dumper
    this.#app = app
    this.value = value
  }

  /**
   * Returns the link to open the file using dd inside one
   * of the known code editors
   */
  #getEditorLink(): { href: string; text: string } | undefined {
    const editorURL = this.#editors[IDE] || IDE
    if (!editorURL) {
      return
    }

    const source = parse(this)[this.#traceSourceIndex]
    if (!source.fileName || !source.lineNumber) {
      return
    }

    return {
      href: editorURL.replace('%f', source.fileName).replace('%l', String(source.lineNumber)),
      text: `${this.#app.relativePath(source.fileName)}:${source.lineNumber}`,
    }
  }

  /**
   * Set the index for the trace source. This is helpful when
   * you build nested helpers on top of Die/Dump
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
   * Handler called by the AdonisJS HTTP exception handler
   */
  async handle(error: DumpDieException, ctx: HttpContext) {
    const link = this.#getEditorLink()
    /**
     * Comes from the shield package
     */
    const cspNonce = 'nonce' in ctx.response ? ctx.response.nonce : undefined

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
          '<div class="adonisjs-dump-header">' +
          '<span class="adonisjs-dump-header-title">DUMP DIE</span>' +
          (link
            ? `<a href="${link.href}" class="adonisjs-dump-header-source">${link.text}</a>`
            : '') +
          '</div>' +
          `${this.#dumper.dumpToHtml(error.value, cspNonce)}` +
          '</body>' +
          '</html>'
      )
  }

  /**
   * Handler called by the AdonisJS Ace kernel
   */
  async render(error: DumpDieException, kernel: Kernel) {
    kernel.ui.logger.log(this.#dumper.dumpToAnsi(error.value))
  }

  /**
   * Custom output for the Node.js util inspect
   */
  [inspect.custom]() {
    return this.#dumper.dumpToAnsi(this.value)
  }
}

export const E_DUMP_DIE_EXCEPTION = DumpDieException
