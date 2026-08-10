/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { dirname } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

import type { Router } from '../../modules/http/main.ts'
import type { ApplicationService } from '../types.ts'

/**
 * Generates TypeScript type definitions and JSON representation of routes
 *
 * Creates route type definitions for better IDE support and a JSON file
 * containing all registered routes. This is used in development mode for
 * tooling integration and type-safety.
 *
 * @param app - The application instance
 * @param router - The router instance containing registered routes
 *
 * @example
 * const router = await app.container.make('router')
 * await emitRoutes(app, router)
 * // Generates .adonisjs/server/routes.d.ts and routes.json
 */
export async function emitRoutes(app: ApplicationService, router: Router) {
  const { routes, imports, types } = router.generateTypes(2)
  const routesTypesPath = app.generatedServerPath('routes.d.ts')
  const routesJsonPath = app.generatedServerPath('routes.json')

  await mkdir(dirname(routesTypesPath), { recursive: true })
  await Promise.all([
    writeFile(
      routesTypesPath,
      [
        `import '@adonisjs/core/types/http'`,
        ...imports,
        '',
        ...types,
        '',
        'export type ScannedRoutes = {',
        routes,
        '}',
        `declare module '@adonisjs/core/types/http' {`,
        '  export interface RoutesList extends ScannedRoutes {}',
        '}',
      ].join('\n')
    ),
    writeFile(routesJsonPath, JSON.stringify(router.toJSON())),
  ])

  app.notify({ isAdonisJS: true, routesFileLocation: routesJsonPath })
}
