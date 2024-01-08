/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringWidth from 'string-width'
import type { RouteJSON } from '../../types/http.js'
import type { UIPrimitives } from '../../types/ace.js'
import { cliHelpers } from '../../modules/ace/main.js'
import { type Router } from '../../modules/http/main.js'
import { parseBindingReference } from '../../src/helpers/main.js'

/**
 * Shape of the serialized route specific to the formatter
 */
type SerializedRoute = {
  name: string
  pattern: string
  methods: string[]
  middleware: string[]
  handler:
    | { type: 'closure'; name: string }
    | { type: 'controller'; moduleNameOrPath: string; method: string }
}

/**
 * Routes list formatter is used to format the routes to JSON or an ANSI string
 * with pretty output.
 *
 * The decisions of colors, padding, alignment are all handled by the lists formatter
 */
export class RoutesListFormatter {
  #router: Router
  #colors: UIPrimitives['colors']
  #table: UIPrimitives['table']

  /**
   * Options for printing routes
   */
  #options: {
    displayHeadRoutes?: boolean
    maxPrettyPrintWidth?: number
  }

  /**
   * Filters to apply when finding routes
   */
  #filters: {
    match?: string
    middleware?: string[]
    ignoreMiddleware?: string[]
  }

  constructor(
    router: Router,
    ui: UIPrimitives,
    options: {
      displayHeadRoutes?: boolean
      maxPrettyPrintWidth?: number
    },
    filters: {
      match?: string
      middleware?: string[]
      ignoreMiddleware?: string[]
    }
  ) {
    this.#router = router
    this.#colors = ui.colors
    this.#table = ui.table
    this.#filters = filters
    this.#options = options
    this.#router.commit()
  }

  /**
   * Test if a route clears the applied filters
   */
  #isAllowedByFilters(route: SerializedRoute) {
    let allowRoute = true

    /**
     * Check if the route is allowed by applying the middleware
     * filter
     */
    if (this.#filters.middleware) {
      allowRoute = this.#filters.middleware.every((name) => {
        if (name === '*') {
          return route.middleware.length > 0
        }

        return route.middleware.includes(name)
      })
    }

    /**
     * Check if the route has any or the ignored middleware. If yes, do not
     * display the route
     */
    if (allowRoute && this.#filters.ignoreMiddleware) {
      allowRoute = this.#filters.ignoreMiddleware.every((name) => {
        if (name === '*') {
          return route.middleware.length === 0
        }

        return !route.middleware.includes(name)
      })
    }

    /**
     * No more filters to be applied
     */
    if (!this.#filters.match) {
      return allowRoute
    }

    /**
     * Check if the route name has the match keyword
     */
    if (route.name.includes(this.#filters.match)) {
      return true
    }

    /**
     * Check if the route pattern has the match keyword
     */
    if (route.pattern.includes(this.#filters.match)) {
      return true
    }

    /**
     * Check if the route handler has the match keyword
     */
    if (
      route.handler.type === 'controller'
        ? route.handler.moduleNameOrPath.includes(this.#filters.match)
        : route.handler.name.includes(this.#filters.match)
    ) {
      return true
    }

    /**
     * Disallow route
     */
    return false
  }

  /**
   * Serialize route middleware to an array of names
   */
  #serializeMiddleware(middleware: RouteJSON['middleware']): string[] {
    return [...middleware.all()].reduce<string[]>((result, one) => {
      if (typeof one === 'function') {
        result.push(one.name || 'closure')
        return result
      }

      if ('name' in one && one.name) {
        result.push(one.name)
      }

      return result
    }, [])
  }

  /**
   * Serialize route handler reference to display object
   */
  async #serializeHandler(handler: RouteJSON['handler']): Promise<SerializedRoute['handler']> {
    /**
     * Value is a controller reference
     */
    if ('reference' in handler) {
      return {
        type: 'controller' as const,
        ...(await parseBindingReference(handler.reference)),
      }
    }

    /**
     * Value is an inline closure
     */
    return {
      type: 'closure' as const,
      name: handler.name || 'closure',
    }
  }

  /**
   * Serializes routes JSON to an object that can be used for pretty printing
   */
  async #serializeRoute(route: RouteJSON): Promise<SerializedRoute> {
    let methods = route.methods
    if (!this.#options.displayHeadRoutes) {
      methods = methods.filter((method) => method !== 'HEAD')
    }

    return {
      name: route.name || '',
      pattern: route.pattern,
      methods: methods,
      handler: await this.#serializeHandler(route.handler),
      middleware: this.#serializeMiddleware(route.middleware),
    }
  }

  /**
   * Formats the route method for the ansi list and table
   */
  #formatRouteMethod(method: string) {
    return this.#colors.dim(method)
  }

  /**
   * Formats route pattern for the ansi list and table
   */
  #formatRoutePattern(route: SerializedRoute) {
    const pattern = this.#router
      .parsePattern(route.pattern)
      .map((token) => {
        if (token.type === 1) {
          return this.#colors.yellow(`:${token.val}`)
        }

        if (token.type === 3) {
          return this.#colors.yellow(`:${token.val}?`)
        }

        if (token.type === 2) {
          return this.#colors.red(token.val)
        }

        return token.val
      })
      .join('/')

    return `${pattern === '/' ? pattern : `/${pattern}`}${
      route.name ? ` ${this.#colors.dim(`(${route.name})`)}` : ''
    } `
  }

  /**
   * Formats controller name for the ansi list and table
   */
  #formatControllerName(route: SerializedRoute) {
    return route.handler.type === 'controller' ? ` ${route.handler.moduleNameOrPath}.` : ''
  }

  /**
   * Formats action name for the ansi list and table
   */
  #formatAction(route: SerializedRoute) {
    return route.handler.type === 'controller'
      ? `${this.#colors.cyan(route.handler.method)}`
      : ` ${this.#colors.cyan(route.handler.name)}`
  }

  /**
   * Formats route middleware for the ansi list and table
   */
  #formatMiddleware(route: SerializedRoute, mode: 'normal' | 'compact' = 'normal') {
    if (mode === 'compact' && route.middleware.length > 3) {
      const firstMiddleware = route.middleware[0]
      const secondMiddleware = route.middleware[1]
      const diff = route.middleware.length - 2
      return this.#colors.dim(`${firstMiddleware}, ${secondMiddleware}, and ${diff} more`)
    }

    return this.#colors.dim(`${route.middleware.filter((one) => one).join(', ')}`)
  }

  /**
   * Formatting the domain headling to be in green color with
   * dots around it
   */
  #formatDomainHeadline(domain: string) {
    if (domain !== 'root') {
      return cliHelpers.justify([`${this.#colors.dim('..')} ${this.#colors.green(domain)} `], {
        maxWidth: this.#options.maxPrettyPrintWidth || cliHelpers.TERMINAL_SIZE,
        paddingChar: this.#colors.dim('.'),
      })[0]
    }
    return ''
  }

  /**
   * Justify the ansi list
   */
  #justifyListTables(tables: { heading: string; rows: [string, string, string, string][] }[]) {
    return tables.map((table) => {
      /**
       * Formatting methods
       */
      const methods = table.rows.map((columns) => columns[0])
      const largestMethodsLength = Math.max(...methods.map((method) => stringWidth(method)))
      const formattedMethods = cliHelpers.justify(methods, {
        maxWidth: largestMethodsLength,
      })

      /**
       * Formatting patterns
       */
      const patterns = table.rows.map((columns) => columns[1])
      const largestPatternLength = Math.max(...patterns.map((pattern) => stringWidth(pattern)))
      const formattedPatterns = cliHelpers.justify(patterns, {
        maxWidth: largestPatternLength,
        paddingChar: this.#colors.dim('.'),
      })

      /**
       * Formatting middleware to be right aligned
       */
      const middleware = table.rows.map((columns) => columns[3])
      const largestMiddlewareLength = Math.max(...middleware.map((one) => stringWidth(one)))
      const formattedMiddleware = cliHelpers.justify(middleware, {
        maxWidth: largestMiddlewareLength,
        align: 'right',
        paddingChar: ' ',
      })

      /**
       * Formatting controllers to be right aligned and take all the remaining
       * space after printing route method, pattern and middleware.
       */
      const controllers = table.rows.map((columns) => columns[2])
      const largestControllerLength =
        (this.#options.maxPrettyPrintWidth || cliHelpers.TERMINAL_SIZE) -
        (largestPatternLength + largestMethodsLength + largestMiddlewareLength)

      const formattedControllers = cliHelpers.truncate(
        cliHelpers.justify(controllers, {
          maxWidth: largestControllerLength,
          align: 'right',
          paddingChar: this.#colors.dim('.'),
        }),
        {
          maxWidth: largestControllerLength,
        }
      )

      return {
        heading: table.heading,
        rows: formattedMethods.reduce<string[]>((result, method, index) => {
          result.push(
            `${method}${formattedPatterns[index]}${formattedControllers[index]}${formattedMiddleware[index]}`
          )
          return result
        }, []),
      }
    })
  }

  /**
   * Formats routes as an array of objects. Routes are grouped by
   * domain.
   */
  async formatAsJSON() {
    const routes = this.#router.toJSON()
    const domains = Object.keys(routes)
    let routesJSON: { domain: string; routes: SerializedRoute[] }[] = []

    for (let domain of domains) {
      const domainRoutes = await Promise.all(
        routes[domain].map((route) => this.#serializeRoute(route))
      )

      routesJSON.push({
        domain,
        routes: domainRoutes.filter((route) => this.#isAllowedByFilters(route)),
      })
    }

    return routesJSON
  }

  /**
   * Format routes to ansi list of tables. Each domain has its own table
   * with heading and rows. Each row has colums with colors and spacing
   * around them.
   */
  async formatAsAnsiList() {
    const routes = this.#router.toJSON()
    const domains = Object.keys(routes)
    const tables: { heading: string; rows: [string, string, string, string][] }[] = []

    for (let domain of domains) {
      const list: (typeof tables)[number] = {
        heading: this.#formatDomainHeadline(domain),
        rows: [
          [
            this.#colors.dim('METHOD'),
            ` ${this.#colors.dim('ROUTE')} `,
            ` ${this.#colors.dim('HANDLER')}`,
            ` ${this.#colors.dim('MIDDLEWARE')}`,
          ],
        ],
      }

      /**
       * Computing table rows. Each route+method will have its
       * own row
       */
      for (let route of routes[domain]) {
        const serializedRoute = await this.#serializeRoute(route)
        if (this.#isAllowedByFilters(serializedRoute)) {
          serializedRoute.methods.forEach((method) => {
            list.rows.push([
              this.#formatRouteMethod(method),
              ` ${this.#formatRoutePattern(serializedRoute)}`,
              `${this.#formatControllerName(serializedRoute)}${this.#formatAction(
                serializedRoute
              )}`,
              ` ${this.#formatMiddleware(serializedRoute, 'compact')}`,
            ])
          })
        }
      }

      tables.push(list)
    }

    return this.#justifyListTables(tables)
  }

  /**
   * Format routes to ansi tables. Each domain has its own table
   * with heading and rows. Each row has colums with colors and spacing
   * around them.
   */
  async formatAsAnsiTable() {
    const routes = this.#router.toJSON()
    const domains = Object.keys(routes)
    const tables: { heading: string; table: ReturnType<UIPrimitives['table']> }[] = []

    for (let domain of domains) {
      const list: (typeof tables)[number] = {
        heading: this.#formatDomainHeadline(domain),
        table: this.#table()
          .fullWidth()
          .fluidColumnIndex(2)
          .head([
            this.#colors.dim('METHOD'),
            this.#colors.dim('ROUTE'),
            { hAlign: 'right', content: this.#colors.dim('HANDLER') },
            { content: this.#colors.dim('MIDDLEWARE'), hAlign: 'right' },
          ]),
      }

      /**
       * Computing table rows. Each route+method will have its
       * own row
       */
      for (let route of routes[domain]) {
        const serializedRoute = await this.#serializeRoute(route)
        if (this.#isAllowedByFilters(serializedRoute)) {
          serializedRoute.methods.forEach((method) => {
            list.table.row([
              this.#formatRouteMethod(method),
              this.#formatRoutePattern(serializedRoute),
              {
                content: `${this.#formatControllerName(serializedRoute)}${this.#formatAction(
                  serializedRoute
                )}`,
                hAlign: 'right',
              },
              { content: this.#formatMiddleware(serializedRoute), hAlign: 'right' },
            ])
          })
        }
      }

      tables.push(list)
    }

    return tables
  }
}
