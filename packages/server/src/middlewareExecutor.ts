/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@adonisjs/utils'
import { ResolvedMiddlewareNode } from './Contracts'
import { exceptionCodes } from '../lib'

/**
 * Executes the middleware based upon it's shape and type
 */
export function middlewareExecutor (middleware: ResolvedMiddlewareNode, params: any[]): Promise<void> {
  /**
   * Call function right away
   */
  if (middleware.type === 'function') {
    return middleware.value(...params, middleware.args)
  }

  /**
   * Make class from the IoC container. Which means the main application must use
   * the `Ioc` container if they want to leverage classes over plain functions
   */
  if (middleware.type === 'class') {
    return global['make'](middleware.value).handle(...params, middleware.args)
  }

  /**
   * We don't know what type of middleware object is this
   */
  throw new Exception(
    `${middleware.type} is not a valid middleware type`,
    500,
    exceptionCodes.E_INVALID_MIDDLEWARE_TYPE,
  )
}
