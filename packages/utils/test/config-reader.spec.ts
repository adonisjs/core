/*
 * @adonisjs/utils
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { ConfigReader } from '../src/ConfigReader'

test.group('ConfigReader', () => {
  test('return from defaults when main is undefined', (assert) => {
    const config = new ConfigReader({ username: 'virk' })
    assert.equal(config.get({}, 'username'), 'virk')
  })

  test('return from main when it\'s null', (assert) => {
    type Config = { username: string | null }
    const defaults: Config = { username: 'virk' }
    const main: Config = { username: null }

    const config = new ConfigReader(defaults)
    assert.isNull(config.get(main, 'username'))
  })

  test('return from main when it\'s defined', (assert) => {
    const config = new ConfigReader({ username: 'virk' })
    assert.equal(config.get({ username: 'nikk' }, 'username'), 'nikk')
  })
})
