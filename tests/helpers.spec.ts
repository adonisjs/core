/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import stringHelpers from '../src/helpers/string.js'

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
})
