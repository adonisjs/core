/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/ace'
import type { SerializedRoute } from './ListRoutes'

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
    ANY: 'red',
    GET: 'blue',
    HEAD: 'white',
    OPTIONS: 'white',
    POST: 'yellow',
    PUT: 'yellow',
    PATCH: 'yellow',
    DELETE: 'red',
  }

  /**
   * Render a single route by concatenating and colorizing each part of it
   */
  private outputRoute(
    methods: string[],
    spaces: string,
    pattern: string,
    dots: string,
    nameAndHandler: string,
    middlewares: string
  ) {
    const methodsOutput = methods
      .map((method) => {
        const methodColor = this.methodColors[method.toUpperCase()]
        return this.command.colors[methodColor](method)
      })
      .join('|')

    const patternOutput = pattern.replace(/:([^/]+)/gm, `${this.command.colors.yellow('$&')}`)
    const nameAndHandlerOutput = this.command.colors.grey(nameAndHandler)
    const dotsOutput = this.command.colors.grey(dots)

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
   * Render the serialized routes to the console
   */
  public render(serializedRoutes: Record<string, SerializedRoute[]>) {
    const routes = Object.keys(serializedRoutes)
      .map((domain) => serializedRoutes[domain])
      .flat()

    const termWidth = this.getTerminalWidth()
    const maxMethodsLength = Math.max(...routes.map((route) => route.methods.join('|').length)) - 1

    routes.forEach((route) => {
      const methods = route.methods.join('|')
      const pattern = route.domain !== 'root' ? `${route.domain}${route.pattern}` : route.pattern
      let nameAndHandler = route.name ? ` ${route.name} ⇒ ${route.handler}` : ` ${route.handler}`

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
      const dots = ' ' + '.'.repeat(Math.max(termWidth - totalLength, 0))

      const middlewares = route.middleware
        .map((middleware) => {
          const startSpace = ' '.repeat(maxMethodsLength + 5)
          return this.command.colors.grey(`${startSpace}⇂ ${middleware}`)
        })
        .join('\n')

      this.outputRoute(route.methods, spaces, pattern, dots, nameAndHandler, middlewares)
    })
  }
}
