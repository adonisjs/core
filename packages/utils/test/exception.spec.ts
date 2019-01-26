/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Exception } from '../src/Exception'

test.group('Exception', () => {
  test('create exception with custom code', (assert) => {
    const error = new Exception('Some message', 500, 'E_SOME_MESSAGE')
    assert.equal(error.message, 'E_SOME_MESSAGE: Some message')
    assert.equal(error.status, 500)
    assert.equal(error.code, 'E_SOME_MESSAGE')
  })

  test('create exception without code', (assert) => {
    const error = new Exception('Some message', 500)
    assert.equal(error.message, 'Some message')
    assert.equal(error.status, 500)
    assert.isUndefined(error.code)
  })

  test('set code to 500 when missing', (assert) => {
    const error = new Exception('Some message')
    assert.equal(error.message, 'Some message')
    assert.equal(error.status, 500)
    assert.isUndefined(error.code)
  })
})
