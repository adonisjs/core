/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CommandOptions } from '../../types/ace.ts'
import { args, BaseCommand, flags } from '../../modules/ace/main.ts'
import { RoutesListFormatter } from '../../src/cli_formatters/routes_list.ts'

/**
 * Command to display a list of all registered routes in the application.
 * Supports filtering by keywords, middleware, and output formatting options.
 * Routes can be displayed as a formatted list, table, or JSON.
 *
 * @example
 * ```
 * ace list:routes
 * ace list:routes user
 * ace list:routes --middleware=auth
 * ace list:routes --ignore-middleware=guest
 * ace list:routes --json
 * ace list:routes --table
 * ```
 */
export default class ListRoutes extends BaseCommand {
  /**
   * The command name
   */
  static commandName = 'list:routes'

  /**
   * The command description
   */
  static description =
    'List all registered routes with their HTTP methods, URL patterns, handlers, and middleware'

  /**
   * Command options configuration.
   * Requires the application to be started so routes are loaded.
   */
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Keyword to match against route names, patterns, and controller names
   */
  @args.string({
    description:
      'Find routes matching the given keyword. Route name, pattern and controller name will be searched against the keyword',
    required: false,
  })
  declare match: string

  /**
   * Filter routes that include all specified middleware names
   */
  @flags.array({
    description:
      'View routes that includes all the mentioned middleware names. Use * to see routes that are using one or more middleware',
  })
  declare middleware: string[]

  /**
   * Filter routes that do not include all specified middleware names
   */
  @flags.array({
    description:
      'View routes that does not include all the mentioned middleware names. Use * to see routes that are using zero middleware',
  })
  declare ignoreMiddleware: string[]

  /**
   * Output routes as JSON format
   */
  @flags.boolean({ description: 'Get routes list as a JSON string' })
  declare json: boolean

  /**
   * Output routes as a CLI table format
   */
  @flags.boolean({ description: 'View list of routes as a table' })
  declare table: boolean

  /**
   * Output routes as JSONL (one JSON object per line), optimized for
   * machine consumption by AI agents and CLI tools
   */
  @flags.boolean({
    description: 'Get routes as JSONL, one JSON object per line (optimized for AI agents)',
  })
  declare jsonl: boolean

  /**
   * Execute the command to list application routes.
   * Creates a formatter with the specified filters and outputs routes
   * in the requested format (JSON, table, or formatted list).
   */
  async run() {
    const router = await this.app.container.make('router')
    const formatter = new RoutesListFormatter(
      router,
      this.ui,
      {},
      {
        ignoreMiddleware: this.ignoreMiddleware,
        middleware: this.middleware,
        match: this.match,
      }
    )

    /**
     * Display as JSONL (one JSON object per line).
     * Auto-selected when running inside an AI agent and no
     * explicit format flag is provided.
     */
    if (this.jsonl || (!this.json && !this.table && this.app.runningInAIAgent)) {
      const lines = await formatter.formatAsJSONL()
      for (const line of lines) {
        this.logger.log(line)
      }
      return
    }

    /**
     * Display as JSON
     */
    if (this.json) {
      this.logger.log(JSON.stringify(await formatter.formatAsJSON(), null, 2))
      return
    }

    /**
     * Display as a standard table
     */
    if (this.table) {
      const tables = await formatter.formatAsAnsiTable()
      tables.forEach((table) => {
        this.logger.log('')
        if (table.heading) {
          this.logger.log(table.heading)
          this.logger.log('')
        }
        table.table.render()
      })
      return
    }

    /**
     * Display as a list
     */
    const list = await formatter.formatAsAnsiList()
    list.forEach((item) => {
      this.logger.log('')
      if (item.heading) {
        this.logger.log(item.heading)
        this.logger.log('')
      }
      this.logger.log(item.rows.join('\n'))
    })
  }
}
