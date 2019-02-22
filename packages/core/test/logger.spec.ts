/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as split from 'split2'
import * as pino from 'pino'

import { Logger } from '../src/Logger'
import { LoggerConfig } from '../src/Contracts/Logger'
import { loggerConfig } from '../config/logger'

const levels = pino().levels.values

function getConfig (config): LoggerConfig {
  return Object.assign({}, loggerConfig, config)
}

test.group('Logger', () => {
  test('log messages at all levels', (assert) => {
    const stack: { msg: string, level: number }[] = []

    const stream = split((data) => {
      const packet = JSON.parse(data)
      stack.push({ msg: packet.msg, level: packet.level })
    })

    const config = getConfig({
      logDestination: () => stream,
      level: 'trace',
    })

    const logger = new Logger(config)
    logger.info('hello world')
    logger.trace('hello world')
    logger.warn('hello world')
    logger.error('hello world')
    logger.debug('hello world')
    logger.fatal('hello world')

    assert.deepEqual(stack, [
      {
        msg: 'hello world',
        level: levels.info,
      },
      {
        msg: 'hello world',
        level: levels.trace,
      },
      {
        msg: 'hello world',
        level: levels.warn,
      },
      {
        msg: 'hello world',
        level: levels.error,
      },
      {
        msg: 'hello world',
        level: levels.debug,
      },
      {
        msg: 'hello world',
        level: levels.fatal,
      },
    ])
  })

  test('log messages after the defined level', (assert) => {
    const stack: { msg: string, level: number }[] = []

    const stream = split((data) => {
      const packet = JSON.parse(data)
      stack.push({ msg: packet.msg, level: packet.level })
    })

    const config = getConfig({
      logDestination: () => stream,
      level: 'warn',
    })

    const logger = new Logger(config)
    logger.info('hello world')
    logger.trace('hello world')
    logger.warn('hello world')
    logger.error('hello world')
    logger.debug('hello world')
    logger.fatal('hello world')

    assert.deepEqual(stack, [
      {
        msg: 'hello world',
        level: levels.warn,
      },
      {
        msg: 'hello world',
        level: levels.error,
      },
      {
        msg: 'hello world',
        level: levels.fatal,
      },
    ])
  })

  test('check if log level is enabled', (assert) => {
    const config = getConfig({
      level: 'warn',
    })

    const logger = new Logger(config)
    assert.isTrue(logger.isLevelEnabled('warn'))
    assert.isTrue(logger.isLevelEnabled('error'))
    assert.isFalse(logger.isLevelEnabled('debug'))
  })

  test('return current log level', (assert) => {
    const config = getConfig({
      level: 'warn',
    })

    const logger = new Logger(config)
    assert.equal(logger.level, 'warn')
  })

  test('return map of log levels', (assert) => {
    const logger = new Logger(loggerConfig)
    assert.deepEqual(logger.levels, {
      labels: {
        '10': 'trace',
        '20': 'debug',
        '30': 'info',
        '40': 'warn',
        '50': 'error',
        '60': 'fatal',
      },
      values: {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60,
      },
    })
  })

  test('log message with merged object', (assert, done) => {
    assert.plan(1)

    const stream = split((data) => {
      const packet = JSON.parse(data)
      assert.equal(packet.id, '1')
      done()
    })

    const config = getConfig({
      logDestination: () => stream,
    })

    const logger = new Logger(config)
    logger.info({ id: 1 }, 'hello world')
  })

  test('substitute message placeholder', (assert, done) => {
    assert.plan(2)

    const stream = split((data) => {
      const packet = JSON.parse(data)
      assert.equal(packet.id, '1')
      assert.equal(packet.msg, 'hello world')
      done()
    })

    const config = getConfig({
      logDestination: () => stream,
    })

    const logger = new Logger(config)
    logger.info({ id: 1 }, 'hello %s', 'world')
  })
})
