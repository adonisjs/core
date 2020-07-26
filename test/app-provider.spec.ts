/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { join } from 'path'
import { Registrar, Ioc } from '@adonisjs/fold'
import { HealthCheck } from '../src/HealthCheck'
import { HttpExceptionHandler } from '../src/HttpExceptionHandler'
import { Application } from '@adonisjs/application/build/standalone'

test.group('Encryption Provider', () => {
	test('register encryption provider', async (assert) => {
		const ioc = new Ioc()

		ioc.bind('Adonis/Core/Application', () => {
			return new Application(join(__dirname, 'fixtures'), ioc, {}, {})
		})

		const registrar = new Registrar(ioc, join(__dirname, '..'))
		await registrar.useProviders(['./providers/AppProvider']).registerAndBoot()

		assert.isTrue(ioc.hasBinding('Adonis/Core/Env'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Config'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Logger'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Encryption'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Profiler'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Request'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Response'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Server'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/MiddlewareStore'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/HttpContext'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Event'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Hash'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/BodyParserMiddleware'))
		assert.isTrue(ioc.hasBinding('Adonis/Core/Validator'))
		assert.instanceOf(ioc.use('Adonis/Core/HealthCheck'), HealthCheck)
		assert.deepEqual(ioc.use('Adonis/Core/HttpExceptionHandler'), HttpExceptionHandler)
	})
})
