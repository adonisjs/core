/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Profiler } from '../src/Profiler'

test.group('Profiler | isEnabled', () => {
  test('return false from isEnabled when enabled inside config is set to false', (assert) => {
    const profiler = new Profiler({ enabled: false })
    assert.isFalse(profiler.isEnabled('http request'))
  })

  test('return true from isEnabled when whitelist is an empty array', (assert) => {
    const profiler = new Profiler({ enabled: true })
    assert.isTrue(profiler.isEnabled('http request'))
  })

  test('return false when whitelist is an empty array but blacklist has the label', (assert) => {
    const profiler = new Profiler({
      enabled: true,
      whitelist: [],
      blacklist: ['http request'],
    })
    assert.isFalse(profiler.isEnabled('http request'))
  })

  test('return false when whitelist doesn\'t have the label', (assert) => {
    const profiler = new Profiler({
      enabled: true,
      whitelist: ['foo'],
      blacklist: [],
    })
    assert.isFalse(profiler.isEnabled('http request'))
  })

  test('return true when whitelist has the label', (assert) => {
    const profiler = new Profiler({
      enabled: true,
      whitelist: ['http request'],
      blacklist: [],
    })
    assert.isTrue(profiler.isEnabled('http request'))
  })

  test('return true if it\'s in whitelist and black list both', (assert) => {
    const profiler = new Profiler({
      enabled: true,
      whitelist: ['http request'],
      blacklist: ['http request'],
    })
    assert.isTrue(profiler.isEnabled('http request'))
  })
})

test.group('Profile | profile', () => {
  test('create a profiler row', (assert) => {
    let packet: any = null

    function subscriber (node) {
      packet = node
    }

    const profiler = new Profiler({})
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    req.end()

    assert.equal(packet.type, 'row')
    assert.equal(packet.label, 'http_request')
    assert.deepEqual(packet.data, { id: '123' })
    assert.isUndefined(packet.parent_id)
  })

  test('create a profiler row and action', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({})
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    const child = req.profile('find_route')
    child.end()
    req.end()

    assert.equal(packets[0].type, 'action')
    assert.equal(packets[0].action, 'find_route')
    assert.deepEqual(packets[0].data, {})
    assert.equal(packets[0].row_id, packets[1].id)

    assert.equal(packets[1].type, 'row')
    assert.equal(packets[1].label, 'http_request')
    assert.deepEqual(packets[1].data, { id: '123' })
    assert.isUndefined(packets[1].parent_id)
  })

  test('create a profiler row with nested row', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({})
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    const core = req.child('core')
    const child = core.profile('find_route')

    child.end()
    core.end()
    req.end()

    assert.equal(packets[0].type, 'action')
    assert.equal(packets[0].action, 'find_route')
    assert.deepEqual(packets[0].data, {})
    assert.equal(packets[0].row_id, packets[1].id)

    assert.equal(packets[1].type, 'row')
    assert.equal(packets[1].label, 'core')
    assert.deepEqual(packets[1].data, {})
    assert.equal(packets[1].parent_id, packets[2].id)

    assert.equal(packets[2].type, 'row')
    assert.equal(packets[2].label, 'http_request')
    assert.deepEqual(packets[2].data, { id: '123' })
    assert.isUndefined(packets[2].parent_id)
  })
})

test.group('Profile | dummy profile', () => {
  test('return dummy profiler instance when enabled is false', (assert) => {
    let packet: any = null

    function subscriber (node) {
      packet = node
    }

    const profiler = new Profiler({ enabled: false })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    req.end()

    assert.isNull(packet)
  })

  test('return dummy action when action is blacklisted', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({ blacklist: ['find_route'] })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    const child = req.profile('find_route')
    child.end()
    req.end()

    assert.lengthOf(packets, 1)
    assert.equal(packets[0].type, 'row')
    assert.equal(packets[0].label, 'http_request')
    assert.deepEqual(packets[0].data, { id: '123' })
    assert.isUndefined(packets[0].parent_id)
  })

  test('return dummy row when it\'s black listed', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({ blacklist: ['core'] })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    const core = req.child('core')
    const child = core.profile('find_route')

    child.end()
    core.end()
    req.end()

    assert.lengthOf(packets, 1)
    assert.equal(packets[0].type, 'row')
    assert.equal(packets[0].label, 'http_request')
    assert.deepEqual(packets[0].data, { id: '123' })
    assert.isUndefined(packets[0].parent_id)
  })

  test('return dummy action within dummy action', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({ enabled: false })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    const core = req.child('core')
    const child = core.profile('find_route')

    child.end()
    core.end()
    req.end()

    assert.lengthOf(packets, 0)
  })

  test('raise error when end is called twice on row', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({ enabled: true })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    req.end()

    const fn = () => req.end()
    assert.throw(fn, 'attempt to end profiler row twice')
  })

  test('do not emit when subscriber is not defined', () => {
    const profiler = new Profiler({ enabled: true })
    const req = profiler.create('http_request', { id: '123' })
    req.end()
  })

  test('merge end data with actual data', (assert) => {
    let packets: any[] = []

    function subscriber (node) {
      packets.push(node)
    }

    const profiler = new Profiler({ enabled: true })
    profiler.subscribe(subscriber)

    const req = profiler.create('http_request', { id: '123' })
    req.end({ time: 11 })
    assert.deepEqual(packets[0].data, { id: '123', time: 11 })
  })

  test('return true when row has a parent', (assert) => {
    const profiler = new Profiler({ enabled: true })

    const req = profiler.create('http_request', { id: '123' })
    assert.isFalse(req.hasParent)

    const view = req.child('render_view')
    assert.isTrue(view.hasParent)
  })

  test('return false from dummy row even when row has a parent', (assert) => {
    const profiler = new Profiler({ enabled: false })

    const req = profiler.create('http_request', { id: '123' })
    assert.isFalse(req.hasParent)

    const view = req.child('render_view')
    assert.isFalse(view.hasParent)
  })
})
