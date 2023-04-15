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

import stringHelpers from '../src/helpers/string.js'
import { parseBindingReference } from '../src/helpers/main.js'

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

test.group('Parse binding reference', () => {
  test('parse magic string value', async ({ assert }) => {
    assert.deepEqual(await parseBindingReference('#controllers/home_controller'), {
      moduleNameOrPath: '#controllers/home_controller',
      method: 'handle',
    })

    assert.deepEqual(await parseBindingReference('#controllers/home_controller.index'), {
      moduleNameOrPath: '#controllers/home_controller',
      method: 'index',
    })

    assert.deepEqual(await parseBindingReference('#controllers/home.controller.index'), {
      moduleNameOrPath: '#controllers/home.controller',
      method: 'index',
    })
  })

  test('parse class reference', async ({ assert }) => {
    class HomeController {}

    assert.deepEqual(await parseBindingReference([HomeController]), {
      moduleNameOrPath: 'HomeController',
      method: 'handle',
    })

    assert.deepEqual(await parseBindingReference([HomeController, 'index']), {
      moduleNameOrPath: 'HomeController',
      method: 'index',
    })
  })

  test('parse lazy import reference', async ({ assert }) => {
    const HomeController = () => import('#controllers/home_controller' as any)

    assert.deepEqual(await parseBindingReference([HomeController]), {
      moduleNameOrPath: '#controllers/home_controller',
      method: 'handle',
    })

    assert.deepEqual(await parseBindingReference([HomeController, 'index']), {
      moduleNameOrPath: '#controllers/home_controller',
      method: 'index',
    })
  })
})
