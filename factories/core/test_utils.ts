/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from '../../index.ts'
import { IgnitorFactory } from './ignitor.ts'
import type { IgnitorOptions } from '../../src/types.ts'
import { TestUtils } from '../../src/test_utils/main.ts'

/**
 * Factory for creating TestUtils instances used in AdonisJS testing scenarios.
 * This factory provides convenient methods to set up test utilities either from
 * an existing Ignitor instance or by creating a new configured one.
 *
 * @example
 * ```ts
 * // Create from URL for testing
 * const factory = new TestUtilsFactory()
 * const testUtils = factory.create(new URL('../', import.meta.url))
 *
 * // Use in tests
 * const app = testUtils.app()
 * await app.boot()
 *
 * // Create HTTP client
 * const client = testUtils.httpClient()
 * const response = await client.get('/users')
 * ```
 */
export class TestUtilsFactory {
  /**
   * Create TestUtils from an existing Ignitor instance
   *
   * @param ignitor - Existing Ignitor instance configured for testing
   */
  create(ignitor: Ignitor): TestUtils
  /**
   * Create TestUtils from application root URL with optional configuration
   *
   * @param appRoot - Application root directory URL
   * @param options - Optional Ignitor configuration options
   */
  create(appRoot: URL, options?: IgnitorOptions): TestUtils
  create(ignitorOrAppRoot: URL | Ignitor, options?: IgnitorOptions): TestUtils {
    if (ignitorOrAppRoot instanceof Ignitor) {
      return new TestUtils(ignitorOrAppRoot.createApp('test'))
    }

    return new TestUtils(
      new IgnitorFactory()
        .withCoreConfig()
        .withCoreProviders()
        .create(ignitorOrAppRoot, options!)
        .createApp('console')
    )
  }
}
