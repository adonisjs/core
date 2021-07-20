/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Cors' {
  import { RequestContract } from '@ioc:Adonis/Core/Request'
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

  type AllowedValuesTypes = boolean | string | string[]

  export type CorsConfig = {
    enabled: boolean | ((request: RequestContract, ctx: HttpContextContract) => boolean)
    origin: AllowedValuesTypes | ((origin: string, ctx: HttpContextContract) => AllowedValuesTypes)
    methods: string[]
    headers:
      | AllowedValuesTypes
      | ((headers: string[], ctx: HttpContextContract) => AllowedValuesTypes)
    exposeHeaders: string[]
    credentials: boolean
    maxAge: number
  }
}
