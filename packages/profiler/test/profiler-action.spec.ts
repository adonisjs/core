/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { ProfilerAction } from '../src/Profiler/Action'

test.group('Profiler action', () => {
  test('get log packet for a given action', (assert) => {
    let logPacket: any = null
    const subscriber = (log) => (logPacket = log)

    const action = new ProfilerAction('123', 'render:view', subscriber, {})
    action.end()

    assert.equal(logPacket.action, 'render:view')
    assert.equal(logPacket.row_id, '123')
    assert.deepEqual(logPacket.data, {})
    assert.equal(logPacket.type, 'action')
    assert.isDefined(logPacket.timestamp)
    assert.isDefined(logPacket.duration)
  })

  test('add data to log packet', (assert) => {
    let logPacket: any = null
    const subscriber = (log) => (logPacket = log)

    const action = new ProfilerAction('123', 'render:view', subscriber, { id: 1 })
    action.end()

    assert.equal(logPacket.action, 'render:view')
    assert.equal(logPacket.row_id, '123')
    assert.deepEqual(logPacket.data, { id: 1 })
    assert.equal(logPacket.type, 'action')
    assert.isDefined(logPacket.timestamp)
    assert.isDefined(logPacket.duration)
  })

  test('merge end data with original action data', (assert) => {
    let logPacket: any = null
    const subscriber = (log) => (logPacket = log)

    const action = new ProfilerAction('123', 'render:view', subscriber, { id: 1 })
    action.end({ name: 'virk' })

    assert.equal(logPacket.action, 'render:view')
    assert.equal(logPacket.row_id, '123')
    assert.deepEqual(logPacket.data, { id: 1, name: 'virk' })
    assert.equal(logPacket.type, 'action')
    assert.isDefined(logPacket.timestamp)
    assert.isDefined(logPacket.duration)
  })

  test('raise error when end is called twice', (assert) => {
    const subscriber = () => {}

    const action = new ProfilerAction('123', 'render:view', subscriber, { id: 1 })
    action.end({ name: 'virk' })

    const fn = () => action.end()
    assert.throws(fn, 'attempt to end profiler action twice')
  })

  test('do not emit when subscriber is not defined', () => {
    const action = new ProfilerAction('123', 'render:view', undefined, { id: 1 })
    action.end({ name: 'virk' })
  })
})
