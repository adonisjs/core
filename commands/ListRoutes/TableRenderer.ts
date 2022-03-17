import { BaseCommand } from '@adonisjs/ace'
import { SerializedRouter } from './ListRoutes'

export class RoutesTableRenderer {
  constructor(private ui: BaseCommand['ui'], private colors: BaseCommand['colors']) {}

  /**
   * Render the serialized routes to the console
   */
  public render(serializedRouter: SerializedRouter) {
    const domains = Object.keys(serializedRouter)
    const showDomainHeadline = domains.length > 1 || domains[0] !== 'root'
    const table = this.ui.table().head(['Method', 'Route', 'Handler', 'Middleware', 'Name'])

    domains.forEach((domain) => {
      if (showDomainHeadline) {
        table.row([{ colSpan: 5, content: `Domain ${this.colors.cyan(domain)}` }])
      }

      serializedRouter[domain].forEach((route) => {
        table.row([
          this.colors.dim(route.methods.join(', ')),
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
