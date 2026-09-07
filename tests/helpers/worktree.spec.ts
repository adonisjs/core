/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { getBasePort, computeWorktreePort } from '../../src/helpers/worktree.ts'

test.group('Worktree port', () => {
  test('read the base port from the .env file', async ({ assert, fs }) => {
    await fs.create('.env', 'PORT=4000\n')

    assert.equal(await getBasePort(fs.baseUrl), 4000)
  })

  test('use 3333 as the base port when PORT is not defined', async ({ assert, fs }) => {
    await fs.create('.env', 'APP_KEY=secret\n')

    assert.equal(await getBasePort(fs.baseUrl), 3333)
  })

  test('compute a deterministic port for a given worktree name', async ({ assert }) => {
    const basePort = 3333

    const port = computeWorktreePort('feature-login', basePort)

    assert.equal(computeWorktreePort('feature-login', basePort), port)
    assert.isAtLeast(port, basePort)
    assert.isBelow(port, basePort + 1000)
  })

  test('compute different ports for different worktree names', async ({ assert }) => {
    const names = ['feature-login', 'feature-checkout', 'feature-export', 'feature-report']
    const ports = names.map((name) => computeWorktreePort(name, 3333))

    assert.equal(new Set(ports).size, ports.length)
  })
})
