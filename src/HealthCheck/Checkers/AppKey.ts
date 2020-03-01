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
 * Message for missing Api Key
 */
const MISSING_APP_KEY_MESSAGE = [
  'Missing APP_KEY environment variable.',
  'It is required to keep your application secure',
].join(' ')

/**
 * Message for insecure Api Key
 */
const INSECURE_APP_KEY_MESSAGE = [
  'Insecure APP_KEY.',
  'It must be 32 characters long.',
  'Run "node ace generate:key" to generate a secure key',
].join(' ')

/**
 * Check for the APP_KEY to ensure it is present and has
 * desired length.
 */
export default function addAppKeyChecker (healthCheck: HealthCheckContract) {
  healthCheck.addChecker('appKey', async () => {
    if (!process.env.APP_KEY) {
      return {
        health: {
          healthy: false,
          message: MISSING_APP_KEY_MESSAGE,
        },
      }
    }

    if (process.env.APP_KEY && process.env.APP_KEY.length < 32) {
      return {
        health: {
          healthy: false,
          message: INSECURE_APP_KEY_MESSAGE,
        },
      }
    }

    return {
      health: {
        healthy: true,
      },
    }
  })
}
