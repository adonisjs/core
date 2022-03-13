import { BaseCommand } from '@adonisjs/ace'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { SerializedRouter } from './ListRoutes'

export class RoutesPrettyRenderer {
  constructor(
    private terminalWidth: number,
    private application: ApplicationContract,
    private colors: BaseCommand['colors'],
    private logger: BaseCommand['logger'],
    private verbose: boolean
  ) {}

  /**
   * The colors associated with each HTTP method
   */
  private methodColors = {
    ANY: this.colors.red.bind(this.colors),
    GET: this.colors.blue.bind(this.colors),
    HEAD: this.colors.white.bind(this.colors),
    OPTIONS: this.colors.white.bind(this.colors),
    POST: this.colors.yellow.bind(this.colors),
    PUT: this.colors.yellow.bind(this.colors),
    PATCH: this.colors.yellow.bind(this.colors),
    DELETE: this.colors.red.bind(this.colors),
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
      .map((method) => this.methodColors[method.toUpperCase()](method))
      .join('|')

    const patternOutput = pattern.replace(/:([^/]+)/gm, `${this.colors.yellow('$&')}`)
    const nameAndHandlerOutput = this.colors.grey(nameAndHandler)
    const dotsOutput = this.colors.grey(dots)

    this.log(methodsOutput + spaces + patternOutput + dotsOutput + nameAndHandlerOutput)

    if (middlewares && this.verbose) {
      this.log(middlewares)
    }
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

  /**
   * Render the serialized routes to the console
   */
  public render(serializedRouter: SerializedRouter) {
    /**
     * Let's flatten routes splitted in different domains
     * in one single array with domain along each route
     */
    let routes = Object.entries(serializedRouter)
      .map(([domain, domainRoutes]) => domainRoutes.map((route) => ({ ...route, domain })))
      .flat()

    const termWidth = this.terminalWidth
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
          return this.colors.grey(`${startSpace}⇂ ${middleware}`)
        })
        .join('\n')

      this.outputRoute(route.methods, spaces, pattern, dots, nameAndHandler, middlewares)
    })
  }
}
