/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import testConsole from 'test-console'
import { prettyPrintError } from '../index.js'

test.group('Pretty print error', () => {
  test('pretty print an error using youch', async ({ assert }) => {
    const output = await testConsole.stderr.inspectAsync(async () => {
      await prettyPrintError(new Error('Something went wrong'))
    })

    assert.match(output[0].trim(), /\[31mError: Something went wrong/)
  })
})
