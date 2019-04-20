/*
* @adonisjs/cookie
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { sign } from 'cookie-signature'
import { pack, serialize, unpack, parse } from '../src/Cookie'

const SECRET = Math.random().toFixed(36).substring(2, 38)

test.group('Cookie | pack', () => {
  test('pack string value', (assert) => {
    assert.equal(pack('hello'), 'hello')
  })

  test('pack boolean value', (assert) => {
    assert.equal(pack(true), `j:${JSON.parse('true')}`)
  })

  test('pack negative boolean value', (assert) => {
    assert.equal(pack(false), `j:${JSON.parse('false')}`)
  })

  test('pack numbers', (assert) => {
    assert.equal(pack(10), `j:${JSON.parse('10')}`)
  })

  test('pack floats', (assert) => {
    assert.equal(pack(10.10), `j:${JSON.parse('10.10')}`)
  })

  test('pack dates', (assert) => {
    const date = new Date()
    assert.equal(pack(date), date.toJSON())
  })

  test('return null when undefined is passed to pack method', (assert) => {
    assert.isNull(pack(undefined))
  })

  test('return null when null is passed to pack method', (assert) => {
    assert.isNull(pack(null))
  })
})

test.group('Cookie | serialize', () => {
  test('serialize and sign cookie', (assert) => {
    assert.equal(
      serialize('username', 'virk', SECRET),
      `username=${encodeURIComponent(`s:${sign('virk', SECRET)}`)}`,
    )
  })

  test('set cookie domain', (assert) => {
    assert.equal(
      serialize('username', 'virk', SECRET, { domain: 'adonisjs.com' }),
      `username=${encodeURIComponent(`s:${sign('virk', SECRET)}`)}; Domain=adonisjs.com`,
    )
  })

  test('set cookie httpOnly', (assert) => {
    assert.equal(
      serialize('username', 'virk', SECRET, { httpOnly: true }),
      `username=${encodeURIComponent(`s:${sign('virk', SECRET)}`)}; HttpOnly`,
    )
  })

  test('do not serialize null values', (assert) => {
    assert.isNull(serialize('username', null, SECRET, { httpOnly: true }))
  })
})

test.group('Cookie | unpack', () => {
  test('unpack plain values', (assert) => {
    assert.deepEqual(unpack(pack('virk')!), {
      signed: false,
      value: 'virk',
    })
  })

  test('unpack signed values', (assert) => {
    assert.deepEqual(unpack(pack('virk', SECRET)!, SECRET), {
      signed: true,
      value: 'virk',
    })
  })

  test('unpack boolean values', (assert) => {
    assert.deepEqual(unpack(pack(false, SECRET)!, SECRET), {
      signed: true,
      value: false,
    })
  })

  test('unpack number values', (assert) => {
    assert.deepEqual(unpack(pack(10, SECRET)!, SECRET), {
      signed: true,
      value: 10,
    })
  })

  test('unpack arrays', (assert) => {
    assert.deepEqual(unpack(pack([10, 20], SECRET)!, SECRET), {
      signed: true,
      value: [10, 20],
    })
  })

  test('unpack objects', (assert) => {
    assert.deepEqual(unpack(pack({ name: 'virk' }, SECRET)!, SECRET), {
      signed: true,
      value: { name: 'virk' },
    })
  })
})

test.group('Cookie | parse', () => {
  test('parse serialized cookies', (assert) => {
    assert.deepEqual(parse(serialize('name', 'virk')!), {
      signedCookies: {},
      plainCookies: { name: 'virk' },
    })
  })

  test('parse signed serialized cookies', (assert) => {
    assert.deepEqual(parse(serialize('name', 'virk', SECRET)!, SECRET), {
      signedCookies: { name: 'virk' },
      plainCookies: {},
    })
  })

  test('do not add key/value pair when unable to unsign value', (assert) => {
    assert.deepEqual(parse(serialize('name', 'virk', 'alongsecretforserializing')!, SECRET), {
      signedCookies: {},
      plainCookies: {},
    })
  })

  test('return default output when cookie header is missing', (assert) => {
    assert.deepEqual(parse('', SECRET), {
      signedCookies: {},
      plainCookies: {},
    })
  })
})
