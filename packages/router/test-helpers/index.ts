/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Route } from '../src/Route'
import { RouteResource } from '../src/Resource'
import { RouteGroup } from '../src/Group'
import { RouteDefination } from '../src/Contracts'

export function toRoutesJSON (routes: (RouteGroup | RouteResource | Route)[]): RouteDefination[] {
  return routes.reduce((list: RouteDefination[], route) => {
    if (route instanceof RouteGroup) {
      list = list.concat(toRoutesJSON(route.routes))
      return list
    }

    if (route instanceof RouteResource) {
      list = list.concat(toRoutesJSON(route.routes))
      return list
    }

    list.push(route.toJSON())
    return list
  }, [])
}
