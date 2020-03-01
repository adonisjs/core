/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Ioc } from '@adonisjs/fold'
import { Application } from '@adonisjs/application/build/standalone'

import { HealthCheck } from '../src/HealthCheck'
import envHealthChecker from '../src/HealthCheck/Checkers/Env'

test.group('Env Health Checker', () => {
  test('fail when NODE_ENV is not defined', async (assert) => {
    const oldEnvValue = process.env.NODE_ENV
    delete process.env.NODE_ENV

    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)
    envHealthChecker(healthCheck)

    const report = await healthCheck.getReport()
    assert.deepEqual(report.report, {
      env: {
        displayName: 'Node Env Check',
        health: {
          healthy: false,
          message: 'Missing NODE_ENV environment variable. It can make some parts of the application misbehave',
        },
      },
    })

    process.env.NODE_ENV = oldEnvValue
  })

  test('work fine when NODE_ENV is defined', async (assert) => {
    process.env.NODE_ENV = 'development'
    const application = new Application(__dirname, new Ioc(), {}, {})
    const healthCheck = new HealthCheck(application)
    envHealthChecker(healthCheck)

    const report = await healthCheck.getReport()
    assert.deepEqual(report.report, {
      env: {
        displayName: 'Node Env Check',
        health: {
          healthy: true,
        },
      },
    })

    delete process.env.NODE_ENV
  })
})
