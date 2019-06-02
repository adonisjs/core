/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/cors.ts" />
/// <reference path="../adonis-typings/response.ts" />
/// <reference path="../adonis-typings/http-context.ts" />

 import * as test from 'japa'
import { createServer } from 'http'
import * as supertest from 'supertest'
import { HttpContext } from '@poppinss/http-server'

import { Cors } from '../src/Middleware/Cors'
import { specFixtures } from './fixtures/cors'

test.group('Cors', () => {
  specFixtures.forEach((fixture) => {
    test(fixture.title, async (assert) => {
      const server = createServer(async (req, res) => {
        const cors = new Cors(fixture.configureOptions())

        fixture.configureRequest(req)
        const ctx = HttpContext.create('/', {}, req, res)
        await cors.handle(ctx, async () => {
          ctx.response.send(null)
        })
      })

      const res = await supertest(server).get('/')
      fixture.assertNormal(assert, res)

      const resOptions = await supertest(server).options('/')
      fixture.assertOptions(assert, resOptions)
    })
  })
})
