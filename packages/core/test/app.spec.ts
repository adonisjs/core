/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { join } from 'path'

import { Ioc, Registrar } from '@adonisjs/fold'
import { Router } from '@adonisjs/router'
import { Server, MiddlewareStore } from '@adonisjs/server'
import { Request, requestConfig } from '@adonisjs/request'
import { Response, responseConfig } from '@adonisjs/response'
import { bodyParserConfig, BodyParserMiddleware } from '@adonisjs/bodyparser'

import { Helpers } from '../src/Helpers'
import { Config } from '../src/Config'
import { Logger } from '../src/Logger'
import { loggerConfig } from '../config/logger'
import { Env } from '../src/Env'

const ioc = new Ioc(false, true)
const registrar = new Registrar(ioc)

test.group('App', (group) => {
  group.beforeEach(async () => {
    process.env.ENV_SILENT = 'true'
    ioc.bind('Adonis/Src/Helpers', () => new Helpers(__dirname, { config: 'config' }))
    global['make'] = ioc.make.bind(ioc)
    await registrar.useProviders([join(__dirname, '../providers', 'AppProvider')]).registerAndBoot()
  })

  group.after(async () => {
    delete process.env.ENV_SILENT
  })

  test('ensure providers are registered properly', async (assert) => {
    assert.instanceOf(ioc.use('Adonis/Src/Config'), Config)
    assert.instanceOf(ioc.use('Adonis/Src/Env'), Env)
    assert.instanceOf(ioc.use('Adonis/Src/Logger'), Logger)
    assert.instanceOf(ioc.use('Adonis/Src/Server'), Server)
    assert.instanceOf(ioc.use('Adonis/Src/Route'), Router)
    assert.instanceOf(ioc.use('Adonis/Src/HttpMiddleware'), MiddlewareStore)
    assert.instanceOf(ioc.use('Adonis/Middleware/BodyParser'), BodyParserMiddleware)

    assert.deepEqual(ioc.use('Adonis/Src/Request'), Request)
    assert.deepEqual(ioc.use('Adonis/Src/Response'), Response)
  })

  test('ensure defaults for the config exists', async (assert) => {
    const conf = ioc.use('Adonis/Src/Config')

    assert.deepEqual(conf.get('app.http'), { ...requestConfig, ...responseConfig })
    assert.deepEqual(conf.get('bodyparser'), bodyParserConfig)
    assert.deepEqual(conf.get('app.logger'), loggerConfig)
  })
})
