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

type ColumnsSize = {
  methodsColumnSize: number
  patternColumnSize: number
  handlerColumnSize: number
  leftOver: number
}

/**
 * Renders the routes in a table
 */
export class RoutesTableRenderer {
  constructor(private command: BaseCommand, private maxWidth?: number) {}

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
   * Returns the terminal width
   */
  private getTerminalWidth() {
    return this.maxWidth || process.stdout.columns || 80
  }

  /**
   * Returns true when the route methods has all the methods
   * defined by "Route.any" method.
   */
  private hasAllMethods(route: SerializedRoute): boolean {
    return ALL_METHODS.every((method) => route.methods.includes(method))
  }

  /**
   * Returns the width for methods column. We limit them at 15 max and
   * return the left over from the column size
   */
  private getMethodsColumnWidth(columnSize: number) {
    return columnSize < 15
      ? { size: columnSize, leftOver: 0 }
      : { size: 15, leftOver: columnSize - 15 }
  }

  /**
   * Returns the width for all the columns.
   */
  private getColumnsSize(): ColumnsSize {
    /**
     * Dividing equal column width between all the columns
     */
    const columnSize = Math.round(this.getTerminalWidth() / 3) - 2

    /**
     * Limiting the methods column width to 15 cells at max. 90% of the
     * time methods fits within this width, for rest of the cases, they
     * will truncate.
     */
    const { size: methodsColumnSize, leftOver } = this.getMethodsColumnWidth(columnSize)

    /**
     * Starting wdith for the patterns column and the handlers column.
     */
    const patternColumnSize = columnSize
    const handlerColumnSize = columnSize

    return {
      methodsColumnSize,
      patternColumnSize,
      handlerColumnSize,
      leftOver,
    }
  }

  /**
   * Distributing the left over from the methods column between
   * the pattern column and the handler column.
   */
  private distributeLeftOverBetweenColumns(columns: ColumnsSize, patternColumnMaxWidth: number) {
    /**
     * If the pattern width is smaller than the column width itself, then
     * we just give all the left over to the handler column.
     */
    if (patternColumnMaxWidth < columns.patternColumnSize) {
      columns.handlerColumnSize += columns.leftOver
      return
    }

    const cellsNeeded = patternColumnMaxWidth - columns.patternColumnSize

    /**
     * If the pattern column width execeeds the left over width, then
     * we just give the left over to the pattern column. This will
     * also make the pattern column truncate.
     */
    if (cellsNeeded > columns.leftOver) {
      columns.patternColumnSize += columns.leftOver
      return
    }

    /**
     * Finally, we give the cells needed for the pattern column and
     * give the rest to the handler column.
     */
    columns.patternColumnSize += cellsNeeded
    columns.handlerColumnSize += columns.leftOver - cellsNeeded
    return
  }

  /**
   * Render the serialized routes to the console
   */
  public render(serializedRoutes: Record<string, SerializedRoute[]>) {
    const domains = Object.keys(serializedRoutes)
    const showDomainHeadline = domains.length > 1 || domains[0] !== 'root'
    const columns = this.getColumnsSize()

    if (columns.leftOver > 0) {
      /**
       * Finding the longest pattern name length. This is done to decide how to
       * distribute the left over of the methods column width.
       */
      const patternsMaxLength =
        Math.max(
          ...domains.map((domain) => {
            return Math.max(...serializedRoutes[domain].map((route) => route.pattern.length))
          })
        ) + 2 // additional 2 is required for the cell padding

      /**
       * Distributing left over among colums
       */
      this.distributeLeftOverBetweenColumns(columns, patternsMaxLength)
    }

    const table = this.command.ui
      .table()
      .head(['Method', 'Route & Name', 'Handler & Middleware'])
      .columnWidths([
        columns.methodsColumnSize,
        columns.patternColumnSize,
        columns.handlerColumnSize,
      ])

    domains.forEach((domain) => {
      if (showDomainHeadline) {
        table.row([{ colSpan: 3, content: `Domain ${this.command.colors.cyan(domain)}` }])
      }

      serializedRoutes[domain].forEach((route) => {
        const methodsOutput = this.hasAllMethods(route)
          ? this.command.colors.cyan('ANY')
          : route.methods
              .map((method) => {
                const methodColor = this.methodColors[method.toUpperCase()]
                return methodColor ? this.command.colors[methodColor](method) : method
              })
              .join(this.command.colors.gray('|'))

        const patternOutput = route.pattern
          .replace(/:([^/]+)/gm, `${this.command.colors.yellow('$&')}`)
          .replace(/\*/gm, `${this.command.colors.red('$&')}`)

        const routePatternAndName = route.name
          ? `${patternOutput}\n${this.command.colors.gray(route.name)}`
          : patternOutput

        let handlerName = typeof route.handler === 'function' ? 'Closure' : route.handler
        handlerName = route.middleware.length
          ? `${handlerName}\n${this.command.colors.gray(route.middleware.join('\n'))}`
          : handlerName

        table.row([methodsOutput, routePatternAndName, handlerName])
      })
    })

    table.render()
  }
}
