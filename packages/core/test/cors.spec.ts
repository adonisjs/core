/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { createServer } from 'http'
import * as supertest from 'supertest'
import { Request } from '@adonisjs/request'
import { Response } from '@adonisjs/response'
import { FakeHttpContext } from '@adonisjs/dev-utils'

import { Cors } from '../src/Cors'
import { specFixtures } from './fixtures/cors'

test.group('Cors', () => {
  specFixtures.forEach((fixture) => {
    test(fixture.title, async (assert) => {
      const server = createServer(async (req, res) => {
        const cors = new Cors(fixture.configureOptions())

        fixture.configureRequest(req)
        const ctx = new FakeHttpContext(Request, Response, { req, res })
        await cors.handle(ctx, () => {
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
