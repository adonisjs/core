/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { TestUtils } from '../src/test_utils/main.js'

let testUtils: TestUtils

/**
 * Returns a singleton instance of the TestUtils class
 * from the container
 */
await app.booted(async () => {
  testUtils = await app.container.make('testUtils')
})

export { testUtils as default }
