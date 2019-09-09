/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import { Ioc } from '@adonisjs/fold'
import { Application } from '@adonisjs/application/build/standalone'
import { HealthCheck } from '../src/HealthCheck'

test.group('HealthCheck', () => {
  test('use application isReady state to find if application is ready', (assert) => {
    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)

    assert.isFalse(healthCheck.isReady())

    application.isReady = true
    assert.isTrue(healthCheck.isReady())

    application.isShuttingDown = true
    assert.isFalse(healthCheck.isReady())
  })

  test('get health checks report', async (assert) => {
    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('event-loop', async () => {
      return {
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
          health: {
            healthy: true,
          },
        },
      },
    })
  })

  test('handle exceptions raised within the checker', async (assert) => {
    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('event-loop', async () => {
      throw new Error('boom')
    })

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: false,
      report: {
        'event-loop': {
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

  test('set healthy to false when any of the checker fails', async (assert) => {
    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)

    healthCheck.addChecker('database', async () => {
      return {
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
          health: {
            healthy: false,
            message: 'boom',
          },
          meta: {
            fatal: true,
          },
        },
        'database': {
          health: {
            healthy: true,
          },
        },
      },
    })
  })

  test('define checker as IoC container binding', async (assert) => {
    const ioc = new Ioc()
    const application = new Application(__dirname, ioc, {}, {})
    const healthCheck = new HealthCheck(application)

    class DbChecker {
      public async report () {
        return {
          health: {
            healthy: true,
          },
        }
      }
    }

    ioc.bind('App/Checkers/Db', () => {
      return new DbChecker()
    })

    global[Symbol.for('ioc.make')] = ioc.make.bind(ioc)
    global[Symbol.for('ioc.call')] = ioc.call.bind(ioc)

    healthCheck.addChecker('database', 'App/Checkers/Db')

    const report = await healthCheck.getReport()
    assert.deepEqual(report, {
      healthy: true,
      report: {
        'database': {
          health: {
            healthy: true,
          },
        },
      },
    })
  })
})
