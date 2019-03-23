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
import { BriskRoute } from '../src/BriskRoute'
import { RouteGroup } from '../src/Group'
import { RouteDefination } from '../src/Contracts'

/**
 * Makes input string consistent by having only the starting
 * slash
 */
export function dropSlash (input: string): string {
  if (input === '/') {
    return '/'
  }

  return `/${input.replace(/^\//, '').replace(/\/$/, '')}`
}

/**
 * Converts and array of routes or route groups or route resource to a flat
 * list of [[RouteDefination]]
 */
export function toRoutesJSON (routes: (RouteGroup | RouteResource | Route | BriskRoute)[]): RouteDefination[] {
  return routes.reduce((list: RouteDefination[], route) => {
    if (route instanceof RouteGroup) {
      list = list.concat(toRoutesJSON(route.routes))
      return list
    }

    if (route instanceof RouteResource) {
      list = list.concat(toRoutesJSON(route.routes))
      return list
    }

    if (route instanceof BriskRoute) {
      if (route.route) {
        list.push(route.route.toJSON())
      }
      return list
    }

    if (!route.deleted) {
      list.push(route.toJSON())
    }
    return list
  }, [])
}

/**
 * Module wide exception codes
 */
export const exceptionCodes = {
  E_MISSING_ROUTE_NAME: 'E_MISSING_ROUTE_NAME',
  E_MULTIPLE_BRISK_HANDLERS: 'E_MULTIPLE_BRISK_HANDLERS',
  E_DUPLICATE_ROUTE: 'E_DUPLICATE_ROUTE',
  E_NESTED_ROUTE_GROUPS: 'E_NESTED_ROUTE_GROUPS',
  E_DUPLICATE_ROUTE_NAME: 'E_DUPLICATE_ROUTE_NAME',
  E_MISSING_ROUTE_PARAM_VALUE: 'E_MISSING_ROUTE_PARAM_VALUE',
}
