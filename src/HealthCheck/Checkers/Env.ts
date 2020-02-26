/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { HealthCheckContract } from '@ioc:Adonis/Core/HealthCheck'

/**
 * Message for missing app key
 */
const MISSING_APP_KEY_MESSAGE = [
  'Missing NODE_ENV environment variable.',
  'It can make some parts of the application misbehave',
].join(' ')

/**
 * Register the `env` checker to ensure that `NODE_ENV` environment
 * variable is defined.
 */
export default function addEnvChecker (healthCheck: HealthCheckContract) {
  healthCheck.addChecker('env', async () => {
    return process.env.NODE_ENV ? {
      health: {
        healthy: true,
      },
    } : {
      health: {
        healthy: false,
        message: MISSING_APP_KEY_MESSAGE,
      },
    }
  })
}
