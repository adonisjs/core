/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { debuglog } from 'node:util'

/**
 * Debug utility for AdonisJS core. This uses Node.js built-in debuglog
 * utility to provide debugging information when the NODE_DEBUG environment
 * variable includes 'adonisjs:core'.
 *
 * @example
 * // Enable debugging by setting environment variable
 * // NODE_DEBUG=adonisjs:core node app.js
 *
 * @example
 * // Usage in code
 * import debug from '@adonisjs/core/debug'
 * debug('Application started')
 * debug('Processing request: %s', req.url)
 */
export default debuglog('adonisjs:core')
