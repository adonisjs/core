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

import test from 'japa'
import { createServer } from 'http'
import supertest from 'supertest'
import { HttpContext as BaseHttpContext } from '@poppinss/http-server'
import { HttpContextConstructorContract } from '@ioc:Adonis/Core/HttpContext'

import { Cors } from '../src/Hooks/Cors'
import { specFixtures } from './fixtures/cors'

const HttpContext = BaseHttpContext as unknown as HttpContextConstructorContract

test.group('Cors', () => {
  specFixtures.forEach((fixture) => {
    test(fixture.title, async (assert) => {
      const server = createServer(async (req, res) => {
        const cors = new Cors(fixture.configureOptions())

        fixture.configureRequest(req)
        const ctx = HttpContext.create('/', {}, req, res)
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
