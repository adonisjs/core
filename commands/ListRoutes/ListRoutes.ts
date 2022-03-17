/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '@adonisjs/ace'
import type { RouterContract } from '@ioc:Adonis/Core/Route'
import { RoutesPrettyRenderer } from './PrettyRenderer'
import { RoutesTableRenderer } from './TableRenderer'

/**
 * Shape of a route serialized by the ListRoute JSON serializer
 */
export type SerializedRoute = {
  domain: string
  name: string
  pattern: string
  handler: string
  methods: string[]
  middleware: string[]
}

/**
 * A command to display a list of routes
 */
export default class ListRoutes extends BaseCommand {
  public static commandName = 'list:routes'
  public static description = 'List application routes'

  @flags.boolean({ alias: 'f', name: 'verbose', description: 'Display more information' })
  public verbose: boolean

  @flags.boolean({ alias: 'r', name: 'reverse', description: 'Reverse routes display' })
  public reverse: boolean

  @flags.string({ alias: 'm', name: 'method', description: 'Filter routes by method' })
  public methodFilter: string

  @flags.string({ alias: 'p', name: 'path', description: 'Filter routes by path' })
  public pathFilter: string

  @flags.string({ alias: 'n', name: 'name', description: 'Filter routes by name' })
  public nameFilter: string

  @flags.boolean({ description: 'Output as JSON' })
  public json: boolean

  @flags.boolean({ description: 'Output as Table' })
  public table: boolean

  @flags.string({ description: 'Specify maximum rendering width. Ignored for JSON Output' })
  public maxWidth: string

  /**
   * Load application
   */
  public static settings = {
    loadApp: true,
  }

  /**
   * Returns an array of routes as JSON, filtered according to the
   * flags passed to the command
   */
  private serializeRoutes(router: RouterContract) {
    const routes = router.toJSON()

    return Object.keys(routes).reduce<Record<string, SerializedRoute[]>>((result, domain) => {
      let domainRoutes = routes[domain].map((route) => {
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
          domain,
          name: route.name || '',
          pattern: route.pattern,
          methods: route.methods,
          handler: handler,
          middleware: middleware,
        }
      })

      if (this.reverse) {
        domainRoutes.reverse()
      }

      /**
       * Let's now filter the routes based on the flags user has passed
       */
      if (this.methodFilter) {
        domainRoutes = domainRoutes.filter((route) =>
          route.methods.includes(this.methodFilter.toUpperCase())
        )
      }

      if (this.pathFilter) {
        domainRoutes = domainRoutes.filter((route) =>
          route.pattern.toUpperCase().includes(this.pathFilter.toUpperCase())
        )
      }

      if (this.nameFilter) {
        domainRoutes = domainRoutes.filter((route) =>
          route.name.toUpperCase().includes(this.nameFilter.toUpperCase())
        )
      }

      result[domain] = domainRoutes
      return result
    }, {})
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
    const tableRenderer = new RoutesTableRenderer(this)
    const prettyRenderer = new RoutesPrettyRenderer(this, this.verbose, this.maxWidth)

    /**
     * Commit routes before we can read them
     */
    Router.commit()

    const serializedRoutes = this.serializeRoutes(Router)

    if (this.json) {
      this.log(JSON.stringify(serializedRoutes, null, 2))
    } else if (this.table) {
      tableRenderer.render(serializedRoutes)
    } else {
      prettyRenderer.render(serializedRoutes)
    }
  }
}
