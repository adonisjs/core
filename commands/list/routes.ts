/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CommandOptions } from '../../types/ace.js'
import { args, BaseCommand, flags } from '../../modules/ace/main.js'
import { RoutesListFormatter } from '../../src/cli_formatters/routes_list.js'

/**
 * The list routes command is used to view the list of registered routes
 */
export default class ListRoutes extends BaseCommand {
  static commandName = 'list:routes'
  static description =
    'List application routes. This command will boot the application in the console environment'

  /**
   * Making sure to start the application so that the routes are
   * imported
   */
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * The match filter is used to find route by name, pattern and controller name that
   * includes the match keyword
   */
  @args.string({
    description:
      'Find routes matching the given keyword. Route name, pattern and controller name will be searched against the keyword',
    required: false,
  })
  declare match: string

  /**
   * The middleware flag searches for the routes using all the mentioned middleware
   */
  @flags.array({
    description:
      'View routes that includes all the mentioned middleware names. Use * to see routes that are using one or more middleware',
  })
  declare middleware: string[]

  /**
   * The ignoreMiddleware flag searches for the routes not using all the mentioned middleware
   */
  @flags.array({
    description:
      'View routes that does not include all the mentioned middleware names. Use * to see routes that are using zero middleware',
  })
  declare ignoreMiddleware: string[]

  /**
   * The json flag is used to view list of routes as a JSON string.
   */
  @flags.boolean({ description: 'Get routes list as a JSON string' })
  declare json: boolean

  /**
   * The table flag is used to view list of routes as a classic CLI table
   */
  @flags.boolean({ description: 'View list of routes as a table' })
  declare table: boolean

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
