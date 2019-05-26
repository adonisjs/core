/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/**
 * The binding for the given module is defined inside `providers/AppProvider.ts`
 * file.
 */
declare module '@ioc:Adonis/Core/Route' {
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
  import {
    RouteContract as BaseRouteContract,
    RouteGroupContract as BaseGroupContract,
    RouteResourceContract as BaseResourceContract,
    BriskRouteContract as BaseBriskContract,
    RouterContract as BaseRouterContract,
  } from '@poppinss/http-server'

  const Route: RouterContract

  /**
   * Module exports
   */
  export interface RouteContract extends BaseRouteContract<HttpContextContract> {}
  export interface RouteGroupContract extends BaseGroupContract<HttpContextContract> {}
  export interface RouteResourceContract extends BaseResourceContract<HttpContextContract> {}
  export interface BriskRouteContract extends BaseBriskContract<HttpContextContract> {}
  export interface RouterContract extends BaseRouterContract<
    HttpContextContract,
    RouteContract,
    RouteGroupContract,
    RouteResourceContract,
    BriskRouteContract
  > {}

  export default Route
}
