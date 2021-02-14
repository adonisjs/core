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

const DISPLAY_NAME = 'App Key Check'

/**
 * Check for the APP_KEY to ensure it is present and has
 * desired length.
 */
export default function addAppKeyChecker(healthCheck: HealthCheckContract) {
  healthCheck.addChecker('appKey', async () => {
    const appKey = process.env.APP_KEY

    if (!appKey) {
      return {
        displayName: DISPLAY_NAME,
        health: {
          healthy: false,
          message: MISSING_APP_KEY_MESSAGE,
        },
      }
    }

    if (appKey && appKey.length < 32) {
      return {
        displayName: DISPLAY_NAME,
        health: {
          healthy: false,
          message: INSECURE_APP_KEY_MESSAGE,
        },
      }
    }

    return {
      displayName: DISPLAY_NAME,
      health: {
        healthy: true,
      },
    }
  })
}
