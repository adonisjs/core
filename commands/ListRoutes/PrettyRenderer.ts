/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/ace'
import type { SerializedRoute } from './index'

const ALL_METHODS = ['HEAD', 'OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Renders the routes as a pretty list
 */
export class RoutesPrettyRenderer {
  constructor(private command: BaseCommand, private verbose: boolean, private maxWidth?: number) {}

  /**
   * Returns the terminal width
   */
  private getTerminalWidth() {
    return this.maxWidth || process.stdout.columns || 80
  }

  /**
   * The colors associated with each HTTP method
   */
  private methodColors: Record<string, keyof BaseCommand['colors']> = {
    GET: 'cyan',
    POST: 'green',
    PUT: 'yellow',
    PATCH: 'yellow',
    DELETE: 'red',
    HEAD: 'gray',
  }

  /**
   * Render a single route by concatenating and colorizing each part of it
   */
  private outputRoute(
    route: SerializedRoute,
    spaces: string,
    pattern: string,
    dots: string,
    nameAndHandler: string,
    middlewares: string
  ) {
    const methodsOutput = this.hasAllMethods(route)
      ? this.command.colors.cyan('ANY')
      : route.methods
          .map((method) => {
            const methodColor = this.methodColors[method.toUpperCase()]
            return methodColor ? this.command.colors[methodColor](method) : method
          })
          .join(this.command.colors.gray('|'))

    const patternOutput = pattern
      .replace(/:([^/]+)/gm, `${this.command.colors.yellow('$&')}`)
      .replace(/\*/gm, `${this.command.colors.red('$&')}`)

    const nameAndHandlerOutput = this.command.colors.gray(nameAndHandler)
    const dotsOutput = this.command.colors.gray(dots)

    this.log(methodsOutput + spaces + patternOutput + dotsOutput + nameAndHandlerOutput)

    if (middlewares && this.verbose) {
      this.log(middlewares)
    }
  }

  /**
   * Log message
   */
  private log(message: string) {
    if (this.command.application.environment === 'test') {
      this.command.logger.log(message)
    } else {
      console.log(message)
    }
  }

  /**
   * Returns true when the route methods has all the methods
   * defined by "Route.any" method.
   */
  private hasAllMethods(route: SerializedRoute): boolean {
    return ALL_METHODS.every((method) => route.methods.includes(method))
  }

  /**
   * Render the serialized routes to the console
   */
  public render(serializedRoutes: Record<string, SerializedRoute[]>) {
    const routes = Object.keys(serializedRoutes)
      .map((domain) => serializedRoutes[domain])
      .flat()

    const termWidth = this.getTerminalWidth()
    const maxMethodsLength =
      Math.max(
        ...routes.map((route) => {
          return this.hasAllMethods(route) ? 'ANY'.length : route.methods.join('|').length
        })
      ) - 1

    routes.forEach((route) => {
      const methods = this.hasAllMethods(route) ? 'ANY' : route.methods.join('|')
      const pattern = route.domain !== 'root' ? `${route.domain}${route.pattern}` : route.pattern
      let nameAndHandler = route.name ? ` ${route.name} › ${route.handler}` : ` ${route.handler}`

      /**
       * Spaces needed to align the start of route patterns
       */
      const spaces = ' '.repeat(Math.max(maxMethodsLength + 5 - methods.length, 0))

      /**
       * If name and handler output is too long we crop it
       */
      const totalLength = (methods + spaces + pattern + ' ' + nameAndHandler).length
      if (totalLength > termWidth) {
        const lenWithoutNameAndHandler = (methods + spaces + pattern + ' ').length
        nameAndHandler = nameAndHandler.substring(0, termWidth - lenWithoutNameAndHandler - 1) + '…'
      }

      /**
       * How many dots we need to align the handlers
       */
      const dots = ' ' + '─'.repeat(Math.max(termWidth - totalLength, 0))

      const middlewares = route.middleware
        .map((middleware) => {
          const startSpace = ' '.repeat(maxMethodsLength + 5)
          return this.command.colors.gray(`${startSpace}├── ${middleware}`)
        })
        .join('\n')

      this.outputRoute(route, spaces, pattern, dots, nameAndHandler, middlewares)
    })
  }
}
