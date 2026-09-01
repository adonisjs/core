/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import StringBuilder from '@poppinss/utils/string_builder'
import stringHelpers from '../src/helpers/string.ts'
import numberHelpers from '../src/helpers/number.ts'

test.group('Number helpers', () => {
  test('clamp value between min and max', ({ assert }) => {
    assert.equal(numberHelpers.clamp(15, 0, 10), 10)
    assert.equal(numberHelpers.clamp(-2, 0, 10), 0)
    assert.equal(numberHelpers.clamp(5, 0, 10), 5)
  })

  test('check if number is between min and max', ({ assert }) => {
    assert.isTrue(numberHelpers.between(5, 0, 10))
    assert.isTrue(numberHelpers.between(0, 0, 10))
    assert.isTrue(numberHelpers.between(10, 0, 10))
    assert.isFalse(numberHelpers.between(-1, 0, 10))
    assert.isFalse(numberHelpers.between(11, 0, 10))
    assert.isTrue(numberHelpers.between(5, 10, 0))
  })

  test('convert value to a finite number', ({ assert }) => {
    assert.equal(numberHelpers.toFinite(5), 5)
    assert.equal(numberHelpers.toFinite('42'), 42)
    assert.equal(numberHelpers.toFinite(Number.NaN), 0)
    assert.equal(numberHelpers.toFinite(Number.POSITIVE_INFINITY), 0)
    assert.equal(numberHelpers.toFinite(Number.NEGATIVE_INFINITY, 3), 3)
    assert.equal(numberHelpers.toFinite('abc', 10), 10)
    assert.equal(numberHelpers.toFinite(undefined), 0)
  })

  test('parse value into a finite number or null', ({ assert }) => {
    assert.equal(numberHelpers.parse(5), 5)
    assert.equal(numberHelpers.parse('42'), 42)
    assert.isNull(numberHelpers.parse(''))
    assert.isNull(numberHelpers.parse(null))
    assert.isNull(numberHelpers.parse(undefined))
    assert.isNull(numberHelpers.parse(Number.NaN))
    assert.isNull(numberHelpers.parse(Number.POSITIVE_INFINITY))
    assert.isNull(numberHelpers.parse('abc'))
  })

  test('format a number', ({ assert }) => {
    assert.equal(numberHelpers.format(12.3456), '12.35')
    assert.equal(numberHelpers.format(12.3456, { digits: 1 }), '12.3')
    assert.equal(numberHelpers.format(1500, { compact: true }), '1.5K')
  })
})

test.group('String helpers', () => {
  test('check if string is empty', ({ assert }) => {
    assert.isTrue(stringHelpers.isEmpty(''))
    assert.isTrue(stringHelpers.isEmpty('    '))
  })

  test('escape html entities', ({ assert }) => {
    assert.equal(stringHelpers.escapeHTML('<p> foo © bar </p>'), '&lt;p&gt; foo © bar &lt;/p&gt;')
  })

  test('escape html entities and encode symbols', ({ assert }) => {
    assert.equal(
      stringHelpers.escapeHTML('<p> foo © bar </p>', { encodeSymbols: true }),
      '&lt;p&gt; foo &#xA9; bar &lt;/p&gt;'
    )
  })

  test('prettify hrtime', async ({ assert }) => {
    const startTime = process.hrtime()
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const endTime = process.hrtime(startTime)

    assert.match(stringHelpers.prettyHrTime(endTime), /^\d(\.\d+)? s$/)
  })

  test('create string builder instance', async ({ assert }) => {
    assert.instanceOf(stringHelpers.create('foo'), StringBuilder)
  })
})
