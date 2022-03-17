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

export class RoutesTableRenderer {
  constructor(private command: BaseCommand) {}

  /**
   * Render the serialized routes to the console
   */
  public render(serializedRoutes: Record<string, SerializedRoute[]>) {
    const domains = Object.keys(serializedRoutes)
    const showDomainHeadline = domains.length > 1 || domains[0] !== 'root'
    const table = this.command.ui.table().head(['Method', 'Route', 'Handler', 'Middleware', 'Name'])

    domains.forEach((domain) => {
      if (showDomainHeadline) {
        table.row([{ colSpan: 5, content: `Domain ${this.command.colors.cyan(domain)}` }])
      }

      serializedRoutes[domain].forEach((route) => {
        table.row([
          this.command.colors.dim(route.methods.join(', ')),
          route.pattern,
          typeof route.handler === 'function' ? 'Closure' : route.handler,
          route.middleware.join(','),
          route.name,
        ])
      })
    })

    table.render()
  }
}
