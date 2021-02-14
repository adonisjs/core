/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '@adonisjs/ace'
import type { RouterContract } from '@ioc:Adonis/Core/Route'

/**
 * A command to display a list of routes
 */
export default class ListRoutes extends BaseCommand {
  public static commandName = 'list:routes'
  public static description = 'List application routes'

  @flags.boolean({ description: 'Output as JSON' })
  public json: boolean

  /**
   * Load application
   */
  public static settings = {
    loadApp: true,
  }

  /**
   * Returns an array of routes as JSON
   */
  private outputJSON(router: RouterContract) {
    const routes = router.toJSON()

    return Object.keys(routes).reduce<{
      [domain: string]: {
        methods: string[]
        name: string
        pattern: string
        handler: string
        middleware: string[]
      }[]
    }>((result, domain) => {
      result[domain] = routes[domain].map((route) => {
        let handler: string = 'Closure'

        const middleware = route
          ? route.middleware.map((one) => (typeof one === 'function' ? 'Closure' : one))
          : []

        if (route.meta.resolvedHandler!.type !== 'function' && route.meta.namespace) {
          handler = `${route.meta.resolvedHandler!['namespace']}.${
            route.meta.resolvedHandler!['method']
          }`
        } else if (route.meta.resolvedHandler!.type !== 'function') {
          const method = route.meta.resolvedHandler!['method']
          const routeHandler = route.handler as string
          handler = `${routeHandler.replace(new RegExp(`.${method}$`), '')}.${method}`
        }

        return {
          methods: route.methods,
          name: route.name || '',
          pattern: route.pattern,
          handler: handler,
          middleware: middleware,
        }
      })

      return result
    }, {})
  }

  /**
   * Output routes a table string
   */
  private outputTable(router: RouterContract) {
    const routes = this.outputJSON(router)
    const domains = Object.keys(routes)
    const showDomainHeadline = domains.length > 1 || domains[0] !== 'root'
    const table = this.ui.table().head(['Method', 'Route', 'Handler', 'Middleware', 'Name'])

    domains.forEach((domain) => {
      if (showDomainHeadline) {
        table.row([{ colSpan: 5, content: `Domain ${this.colors.cyan(domain)}` }])
      }

      routes[domain].forEach((route) => {
        table.row([
          this.colors.dim(route.methods.join(', ')),
          route.pattern,
          typeof route.handler === 'function' ? 'Closure' : route.handler,
          route.middleware.join(','),
          route.name,
        ])
      })
    })

    table.render()
  }

  /**
   * Log message
   */
  private log(message: string) {
    if (this.application.environment === 'test') {
      this.logger.log(message)
    } else {
      console.log(message)
    }
  }

  public async run() {
    const Router = this.application.container.use('Adonis/Core/Route')

    /**
     * Commit routes before we can read them
     */
    Router.commit()

    if (this.json) {
      this.log(JSON.stringify(this.outputJSON(Router), null, 2))
    } else {
      this.outputTable(Router)
    }
  }
}
