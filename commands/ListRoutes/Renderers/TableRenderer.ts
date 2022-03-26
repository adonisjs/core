/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

import ListRoutes from '../index'
import { BaseRender } from './Base'

type ColumnsSize = {
  methodsColumnSize: number
  patternColumnSize: number
  handlerColumnSize: number
  leftOver: number
}

/**
 * Renders the routes in a table
 */
export class RoutesTableRenderer extends BaseRender {
  private routes = this.command.serializeRoutes()
  private domains = Object.keys(this.routes)
  private columns = this.getColumnsSize()
  private longestPatternName = this.getLongestPatterName()

  constructor(command: ListRoutes) {
    super(command)
  }

  /**
   * Returns the length of the longest pattern name among
   * all the routes
   */
  private getLongestPatterName() {
    return (
      Math.max(
        ...this.domains.map((domain) => {
          return Math.max(...this.routes[domain].map((route) => route.pattern.length))
        })
      ) + 2
    )
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
    const columnSize = Math.round(this.getRenderingWidth() / 3) - 2

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
  private distributeLeftOverBetweenColumns() {
    /**
     * If the pattern width is smaller than the column width itself, then
     * we just give all the left over to the handler column.
     */
    if (this.longestPatternName < this.columns.patternColumnSize) {
      this.columns.handlerColumnSize += this.columns.leftOver
      return
    }

    const cellsNeeded = this.longestPatternName - this.columns.patternColumnSize

    /**
     * If the pattern column width execeeds the left over width, then
     * we just give the left over to the pattern column. This will
     * also make the pattern column truncate.
     */
    if (cellsNeeded > this.columns.leftOver) {
      this.columns.patternColumnSize += this.columns.leftOver
      return
    }

    /**
     * Finally, we give the cells needed for the pattern column and
     * give the rest to the handler column.
     */
    this.columns.patternColumnSize += cellsNeeded
    this.columns.handlerColumnSize += this.columns.leftOver - cellsNeeded
    return
  }

  private getTable() {
    if (this.columns.leftOver > 0) {
      this.distributeLeftOverBetweenColumns()
    }

    return this.command.ui
      .table()
      .head(['Method', 'Route & Name', 'Handler & Middleware'])
      .columnWidths([
        this.columns.methodsColumnSize,
        this.columns.patternColumnSize,
        this.columns.handlerColumnSize,
      ])
  }

  /**
   * Render the serialized routes to the console
   */
  public render() {
    const hasCustomDomains = this.domains.find((domain) => domain !== 'root')
    const table = this.getTable()

    this.domains.forEach((domain) => {
      if (hasCustomDomains) {
        table.row([{ colSpan: 3, content: this.command.colors.cyan(domain) }])
      }

      const domainRoutes = this.routes[domain]

      domainRoutes.forEach((route) => {
        const methodsOutput = this.colorizeRouteMethods(route.methods)
        const patternAndNameOutput = route.name
          ? `${this.colorizeRoutePattern(route.pattern)}\n${this.command.colors.gray(route.name)}`
          : this.colorizeRoutePattern(route.pattern)

        const handlerOutput = route.middleware.length
          ? `${route.handler}\n${this.command.colors.gray(route.middleware.join('\n'))}`
          : route.handler

        table.row([methodsOutput, patternAndNameOutput, handlerOutput])
      })
    })

    table.render()
  }
}
