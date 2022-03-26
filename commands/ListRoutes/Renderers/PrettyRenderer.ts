/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

import { BaseRender } from './Base'
import ListRoutes, { type SerializedRoute } from '../index'

/**
 * Renders the routes as a pretty list
 */
export class RoutesPrettyRenderer extends BaseRender {
  private routes = this.serializeRotues()
  private renderingWidth = this.getRenderingWidth()
  private longestMethodName = this.findLongestMethodName()

  constructor(command: ListRoutes) {
    super(command)
  }

  /**
   * Returns a list of serialized routes
   */
  private serializeRotues() {
    const serializedRoutes = this.command.serializeRoutes()

    return Object.keys(serializedRoutes)
      .map((domain) => serializedRoutes[domain])
      .flat()
  }

  /**
   * Returns the name of the longest method name
   * across all the routes
   */
  private findLongestMethodName() {
    return (
      Math.max(
        ...this.routes.map((route) => {
          return this.hasAllMethods(route.methods) ? 'ANY'.length : route.methods.join('|').length
        })
      ) - 1
    )
  }

  /**
   * Render a single route by concatenating and colorizing each part of it
   */
  private outputRoute(
    route: SerializedRoute,
    renderingOptions: { spaces: string; dashes: string }
  ) {
    const methodsOutput = this.colorizeRouteMethods(route.methods)
    const patternOutput = this.colorizeRoutePattern(route.pattern)
    const nameAndHandlerOutput = this.command.colors.gray(route.handler)
    const dashesOutput = this.command.colors.gray(renderingOptions.dashes)

    this.log(
      methodsOutput + renderingOptions.spaces + patternOutput + dashesOutput + nameAndHandlerOutput
    )

    /**
     * Display middleware in verbose mode
     */
    if (route.middleware.length && this.command.verbose) {
      const middleware = route.middleware
        .map((one) => {
          const glyph = '├──'
          const spaces = ' '.repeat(Math.max(this.longestMethodName + 5, 0))
          return this.command.colors.gray(`${spaces} ${glyph} ${one}`)
        })
        .join('\n')
      this.log(middleware)
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
   * Crop the handler name
   */
  private cropHandlerName(handlerName: string, totalLength: number) {
    return handlerName.substring(0, this.renderingWidth - totalLength - 1) + '…'
  }

  /**
   * Returns the whitespace to be rendered between the
   * route methods and the route pattern
   */
  private getWhiteSpace(methods: string) {
    return ' '.repeat(Math.max(this.longestMethodName + 5 - methods.length, 0))
  }

  /**
   * Returns the rendering width with and without the
   * route handler
   */
  private getRenderingWidths(
    methods: string,
    spaces: string,
    pattern: string,
    nameAndHandler: string
  ) {
    const widthWithoutHandler = (methods + spaces + pattern).length + 1
    const totalWidth = widthWithoutHandler + nameAndHandler.length
    return { widthWithoutHandler, totalWidth }
  }

  /**
   * Returns the dashes to be rendered between pattern and the
   * route handler name.
   */
  private getDashes(totalWidth: number) {
    return ` ${'─'.repeat(Math.max(this.renderingWidth - totalWidth, 0))}`
  }

  /**
   * Renders routes to the console
   */
  public render() {
    this.routes.forEach((route) => {
      const methods = this.hasAllMethods(route.methods) ? 'ANY' : route.methods.join('|')
      const pattern = route.domain !== 'root' ? `${route.domain}${route.pattern}` : route.pattern
      let handler = route.name ? ` ${route.name} › ${route.handler}` : ` ${route.handler}`
      const spaces = this.getWhiteSpace(methods)
      const widths = this.getRenderingWidths(methods, spaces, pattern, handler)
      const dashes = this.getDashes(widths.totalWidth)

      /**
       * If name and handler output is too long we crop it
       */
      if (widths.totalWidth > this.renderingWidth) {
        handler = this.cropHandlerName(handler, widths.widthWithoutHandler)
      }

      this.outputRoute(
        {
          pattern,
          handler,
          middleware: route.middleware,
          methods: route.methods,
          domain: route.domain,
          name: route.name,
        },
        {
          spaces,
          dashes,
        }
      )
    })
  }
}
