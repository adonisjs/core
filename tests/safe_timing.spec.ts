/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { safeTiming } from '../src/helpers/safe_timing.ts'

test.group('safeTiming', () => {
  test('enforces minimum execution time', async ({ assert }) => {
    const start = performance.now()

    await safeTiming(200, async () => {
      return 'done'
    })

    const elapsed = performance.now() - start
    assert.isAbove(elapsed, 190)
  })

  test('returns the callback result', async ({ assert }) => {
    const result = await safeTiming(50, async () => {
      return { message: 'hello' }
    })

    assert.deepEqual(result, { message: 'hello' })
  })

  test('does not add delay when callback already exceeds minimum time', async ({ assert }) => {
    const start = performance.now()

    await safeTiming(50, async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'slow'
    })

    const elapsed = performance.now() - start
    assert.isAbove(elapsed, 95)
    assert.isBelow(elapsed, 200)
  })

  test('returnEarly skips the minimum time wait', async ({ assert }) => {
    const start = performance.now()

    await safeTiming(500, async (box) => {
      box.returnEarly()
      return 'fast'
    })

    const elapsed = performance.now() - start
    assert.isBelow(elapsed, 100)
  })

  test('still waits minimum time when callback throws', async ({ assert }) => {
    const start = performance.now()

    await assert.rejects(async () => {
      await safeTiming(200, async () => {
        throw new Error('kaboom')
      })
    }, 'kaboom')

    const elapsed = performance.now() - start
    assert.isAbove(elapsed, 190)
  })

  test('skips wait on error when returnEarly was called', async ({ assert }) => {
    const start = performance.now()

    await assert.rejects(async () => {
      await safeTiming(500, async (box) => {
        box.returnEarly()
        throw new Error('early error')
      })
    }, 'early error')

    const elapsed = performance.now() - start
    assert.isBelow(elapsed, 100)
  })
})
