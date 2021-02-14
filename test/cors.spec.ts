/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import supertest from 'supertest'
import { createServer } from 'http'

import { Cors } from '../src/Hooks/Cors'
import { specFixtures } from './fixtures/cors'
import { fs, setupApp } from '../test-helpers'

test.group('Cors', (group) => {
  group.afterEach(async () => {
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')

    await fs.cleanup()
  })

  specFixtures.forEach((fixture) => {
    test(fixture.title, async (assert) => {
      const app = await setupApp()

      const server = createServer(async (req, res) => {
        const cors = new Cors(fixture.configureOptions())
        fixture.configureRequest(req)

        const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {}, req, res)
        await cors.handle(ctx)

        if (!ctx.response.hasLazyBody) {
          ctx.response.send(null)
        }

        ctx.response.finish()
      })

      const res = await supertest(server).get('/')
      fixture.assertNormal(assert, res)

      const resOptions = await supertest(server).options('/')
      fixture.assertOptions(assert, resOptions)
    })
  })
})
