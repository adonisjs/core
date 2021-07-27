/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
  import { DriveManagerContract } from '@ioc:Adonis/Core/Drive'
  import { HealthCheckContract } from '@ioc:Adonis/Core/HealthCheck'
  import { AssetsManagerContract } from '@ioc:Adonis/Core/AssetsManager'
  import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'

  export interface ContainerBindings {
    'Adonis/Core/Drive': DriveManagerContract
    'Adonis/Core/HealthCheck': HealthCheckContract
    'Adonis/Core/AssetsManager': AssetsManagerContract
    'Adonis/Core/HttpExceptionHandler': typeof HttpExceptionHandler
  }
}
