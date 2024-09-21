/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import useColors from '@poppinss/colors'
import { dump as consoleDump } from '@poppinss/dumper/console'
import type { HTMLDumpConfig } from '@poppinss/dumper/html/types'
import type { ConsoleDumpConfig } from '@poppinss/dumper/console/types'
import { createScript, createStyleSheet, dump } from '@poppinss/dumper/html'

import type { Application } from '../app.js'
import { E_DUMP_DIE_EXCEPTION } from './errors.js'

const colors = useColors.ansi()

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

const IDE = process.env.ADONIS_IDE ?? process.env.EDITOR ?? ''

/**
 * Dumper exposes the API to dump or die/dump values in your
 * AdonisJS application. An singleton instance of the Dumper
 * is shared as a service and may use it follows.
 *
 * ```ts
 * const dumper = container.make('dumper')
 *
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
 *
 * const head = dumper.getHeadElements()
 * ```
 */
export class Dumper {
  #app: Application<any>

  /**
   * Configuration for the HTML formatter
   */
  #htmlConfig: HTMLDumpConfig = {}

  /**
   * Configuration for the Console formatter
   */
  #consoleConfig: ConsoleDumpConfig = {
    collapse: ['DateTime', 'Date'],
  }

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

  constructor(app: Application<any>) {
    this.#app = app
  }

  /**
   * Returns the link to open the file using dd inside one
   * of the known code editors
   */
  #getEditorLink(source?: {
    location: string
    line: number
  }): { href: string; text: string } | undefined {
    const editorURL = this.#editors[IDE] || IDE
    if (!editorURL || !source) {
      return
    }

    return {
      href: editorURL.replace('%f', source.location).replace('%l', String(source.line)),
      text: `${this.#app.relativePath(source.location)}:${source.line}`,
    }
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
      `<style id="dumper-styles">` +
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
  dumpToHtml(
    value: unknown,
    options: {
      cspNonce?: string
      title?: string
      source?: {
        location: string
        line: number
      }
    } = {}
  ) {
    const link = this.#getEditorLink(options.source) ?? null
    const title = options.title || 'DUMP'

    return (
      '<div class="adonisjs-dump-header">' +
      `<span class="adonisjs-dump-header-title">${title}</span>` +
      (link ? `<a href="${link.href}" class="adonisjs-dump-header-source">${link.text}</a>` : '') +
      '</div>' +
      dump(value, { cspNonce: options.cspNonce, ...this.#htmlConfig })
    )
  }

  /**
   * Dump value to ANSI output
   */
  dumpToAnsi(
    value: unknown,
    options: {
      title?: string
      source?: {
        location: string
        line: number
      }
    } = {}
  ) {
    const columns = process.stdout.columns

    /**
     * Link to the source file
     */
    const link = `${this.#getEditorLink(options.source)?.text ?? ''} `

    /**
     * Dump title
     */
    const title = ` ${options.title || 'DUMP'}`

    /**
     * Whitespace between the title and the link to align them
     * on each side of x axis
     */
    const whiteSpaceLength = columns - link.length - title.length - 4
    console.log({ whiteSpaceLength, new: whiteSpaceLength <= 0 ? 1 : whiteSpaceLength })
    const whiteSpace = new Array(whiteSpaceLength <= 0 ? 1 : whiteSpaceLength).join(' ')

    /**
     * Styled heading with background color and bold text
     */
    const heading = colors.bgRed().bold(`${title}${whiteSpace}${link}`)

    return `${heading}\n${consoleDump(value, this.#consoleConfig)}`
  }

  /**
   * Dump values and die. The formatter will be picked
   * based upon where your app is running.
   *
   * - During an HTTP request, the HTML output will be
   *   sent to the server.
   * - Otherwise the value will be logged in the console
   */
  dd(value: unknown, traceSourceIndex: number = 1) {
    const error = new E_DUMP_DIE_EXCEPTION(value, this)
    error.setTraceSourceIndex(traceSourceIndex)
    throw error
  }
}
