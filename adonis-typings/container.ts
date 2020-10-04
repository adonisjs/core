/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
	import { HealthCheckContract } from '@ioc:Adonis/Core/HealthCheck'
	import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'

	export interface ContainerBindings {
		'Adonis/Core/HealthCheck': HealthCheckContract
		'Adonis/Core/HttpExceptionHandler': typeof HttpExceptionHandler
	}
}
