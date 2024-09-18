/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dump as consoleDump } from '@poppinss/dumper/console'
import type { HTMLDumpConfig } from '@poppinss/dumper/html/types'
import type { ConsoleDumpConfig } from '@poppinss/dumper/console/types'
import { createScript, createStyleSheet, dump } from '@poppinss/dumper/html'

import type { Application } from '../app.js'
import { E_DUMP_DIE_EXCEPTION } from './errors.js'

const DUMP_TITLE_STYLES = `
.adonisjs-dump-header {
  font-family: JetBrains Mono, monaspace argon, Menlo, Monaco, Consolas, monospace;
  background: #ff1639;
  border-radius: 4px;
  color: #fff;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  padding: 0.4rem 1.2rem;
  font-size: 1em;
  display: flex;
  justify-content: space-between;
}
.adonisjs-dump-header .adonisjs-dump-header-title {
  font-weight: bold;
  text-transform: uppercase;
}
.adonisjs-dump-header .adonisjs-dump-header-source {
  font-weight: bold;
  color: inherit;
  text-decoration: underline;
}
.dumper-dump pre {
  border-radius: 4px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}`

/**
 * Dumper exposes the API to dump or die/dump values via your
 * AdonisJS application. An singleton instance of the Dumper
 * is shared as a service and may use it follows.
 *
 * ```ts
 * dumper.configureHtmlOutput({
 *   // parser + html formatter config
 * })
 *
 * dumper.configureAnsiOutput({
 *   // parser + console formatter config
 * })
 *
 * const html = dumper.dumpToHtml(value)
 * const ansi = dumper.dumpToAnsi(value)
 *
 * // Returns style and script tags that must be
 * // injeted to the head of the HTML document
 * const head = dumper.getHeadElements()
 * ```
 */
export class Dumper {
  #app: Application<any>
  #htmlConfig: HTMLDumpConfig = {}
  #consoleConfig: ConsoleDumpConfig = {
    collapse: ['DateTime', 'Date'],
  }

  constructor(app: Application<any>) {
    this.#app = app
  }

  /**
   * Configure the HTML formatter output
   */
  configureHtmlOutput(config: HTMLDumpConfig): this {
    this.#htmlConfig = config
    return this
  }

  /**
   * Configure the ANSI formatter output
   */
  configureAnsiOutput(config: ConsoleDumpConfig): this {
    this.#consoleConfig = config
    return this
  }

  /**
   * Returns the style and the script elements for the
   * HTML document
   */
  getHeadElements(cspNonce?: string): string {
    return (
      '<style id="dumper-styles">' +
      createStyleSheet() +
      DUMP_TITLE_STYLES +
      '</style>' +
      `<script id="dumper-script"${cspNonce ? ` nonce="${cspNonce}"` : ''}>` +
      createScript() +
      '</script>'
    )
  }

  /**
   * Dump value to HTML ouput
   */
  dumpToHtml(value: unknown, cspNonce?: string) {
    return dump(value, { cspNonce, ...this.#htmlConfig })
  }

  /**
   * Dump value to ANSI output
   */
  dumpToAnsi(value: unknown) {
    return consoleDump(value, this.#consoleConfig)
  }

  /**
   * Dump values and die. The formatter will be picked
   * based upon where your app is running.
   *
   * - In CLI commands, the ANSI output will be printed
   *   to the console.
   * - During an HTTP request, the HTML output will be
   *   sent to the server.
   */
  dd(value: unknown, traceSourceIndex: number = 1) {
    const error = new E_DUMP_DIE_EXCEPTION(value, this, this.#app)
    error.setTraceSourceIndex(traceSourceIndex)
    throw error
  }
}
