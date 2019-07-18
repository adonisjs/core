/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Core/Cors' {
  type AllowedValuesTypes = boolean | string | string[]
  export type CorsConfigContract = {
    origin: AllowedValuesTypes | ((origin: string) => AllowedValuesTypes),
    methods: string[],
    headers: AllowedValuesTypes | ((headers: string[]) => AllowedValuesTypes),
    exposeHeaders: string[],
    credentials: boolean,
    maxAge: number,
  }
}
