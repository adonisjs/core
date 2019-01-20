/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export type Matchers = {
  [param: string]: string | RegExp,
}

export type RouteNode = {
  pattern: string,
  handler: any,
  middleware: any[],
  matchers: Matchers,
  meta: any,
  name?: string,
}

export type RouteDefination = RouteNode & { methods: string[], domain?: string }
