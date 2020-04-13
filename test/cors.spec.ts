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
import { Logger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { Encryption } from '@adonisjs/encryption/build/standalone'
import { HttpContext } from '@adonisjs/http-server/build/standalone'

import { Cors } from '../src/Hooks/Cors'
import { specFixtures } from './fixtures/cors'

const encryption = new Encryption({
  secret: 'verylongandrandom32characterskey',
})

test.group('Cors', () => {
  specFixtures.forEach((fixture) => {
    test(fixture.title, async (assert) => {
      const server = createServer(async (req, res) => {
        const cors = new Cors(fixture.configureOptions())
        const logger = new Logger({ name: 'adonis', enabled: false, level: 'trace' })

        fixture.configureRequest(req)
        const ctx = HttpContext.create(
          '/',
          {},
          logger,
          new Profiler(__dirname, logger, {}).create(''),
          encryption,
          req,
          res,
        )
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
