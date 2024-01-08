/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from '../../index.js'
import { IgnitorFactory } from './ignitor.js'
import type { IgnitorOptions } from '../../src/types.js'
import { TestUtils } from '../../src/test_utils/main.js'

/**
 * Creates an instance of TestUtils class
 */
export class TestUtilsFactory {
  create(ignitor: Ignitor): TestUtils
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
