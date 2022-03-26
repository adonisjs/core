/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand } from '@adonisjs/core/build/standalone'
import ListRoutes from '..'

/**
 * Methods registered by "Route.any" method
 */
const ALL_METHODS = ['HEAD', 'OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export class BaseRender {
  constructor(protected command: ListRoutes) {}

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
   * Returns the color name for a HTTP method
   */
  public getHttpMethodColor(method: string): keyof BaseCommand['colors'] {
    const methodColor = this.methodColors[method]
    return methodColor ? methodColor : 'gray'
  }

  /**
   * Find if the route contains all the methods registered by
   * the "Route.any" method
   */
  public hasAllMethods(methods: string[]) {
    return ALL_METHODS.every((method) => methods.includes(method))
  }

  /**
   * Colorize the route methods
   */
  public colorizeRouteMethods(methods: string[]) {
    return this.hasAllMethods(methods)
      ? this.command.colors.cyan('ANY')
      : methods
          .map((method) => this.command.colors[this.getHttpMethodColor(method)](method))
          .join(this.command.colors.gray('|'))
  }

  /**
   * Colorize the route pattern
   */
  public colorizeRoutePattern(pattern: string) {
    return pattern
      .replace(/:([^/]+)/gm, `${this.command.colors.yellow('$&')}`)
      .replace(/\*/gm, `${this.command.colors.red('$&')}`)
  }

  /**
   * Returns the rendering width.
   */
  public getRenderingWidth() {
    return this.command.maxWidth || process.stdout.columns || 80
  }
}
