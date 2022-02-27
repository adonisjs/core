/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/index.ts" />

import { test } from '@japa/runner'
import { Application } from '@adonisjs/application'
import { HealthCheck } from '../src/HealthCheck'

test.group('HealthCheck', () => {
  test('use application isReady state to find if application is ready', ({ assert }) => {
    const application = new Application(__dirname, 'web', {})
    const healthCheck = new HealthCheck(application)

    assert.isFalse(healthCheck.isReady())

    application.state = 'ready'
    assert.isTrue(healthCheck.isReady())

    application.isShuttingDown = true
    assert.isFalse(healthCheck.isReady())
  })

  test('get health checks report', async ({ assert }) => {
    const application = new Application(__dirname, 'web', {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('event-loop', async () => {
      return {
        displayName: 'event loop',
        health: {
          healthy: true,
        },
      }
    })

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: true,
      report: {
        'event-loop': {
          displayName: 'event loop',
          health: {
            healthy: true,
          },
        },
      },
    })
  })

  test('handle exceptions raised within the checker', async ({ assert }) => {
    const application = new Application(__dirname, 'web', {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('event-loop', async () => {
      throw new Error('boom')
    })

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: false,
      report: {
        'event-loop': {
          displayName: 'event-loop',
          health: {
            healthy: false,
            message: 'boom',
          },
          meta: {
            fatal: true,
          },
        },
      },
    })
  })

  test('set healthy to false when any of the checker fails', async ({ assert }) => {
    const application = new Application(__dirname, 'web', {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('database', async () => {
      return {
        displayName: 'database',
        health: {
          healthy: true,
        },
      }
    })

    healthCheck.addChecker('event-loop', async () => {
      throw new Error('boom')
    })

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: false,
      report: {
        'event-loop': {
          displayName: 'event-loop',
          health: {
            healthy: false,
            message: 'boom',
          },
          meta: {
            fatal: true,
          },
        },
        'database': {
          displayName: 'database',
          health: {
            healthy: true,
          },
        },
      },
    })
  })

  test('define checker as IoC container binding', async ({ assert }) => {
    const application = new Application(__dirname, 'web', {})
    const healthCheck = new HealthCheck(application)

    class DbChecker {
      public async report() {
        return {
          health: {
            healthy: true,
          },
        }
      }
    }

    application.container.bind('App/Checkers/Db', () => {
      return new DbChecker()
    })

    healthCheck.addChecker('database', 'App/Checkers/Db')

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: true,
      report: {
        database: {
          displayName: 'database',
          health: {
            healthy: true,
          },
        },
      },
    })
  })
})
