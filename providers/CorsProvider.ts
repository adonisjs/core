/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { IocContract } from '@adonisjs/fold'
import { Cors } from '../src/Cors'

export default class CorsProvider {
  constructor (protected $container: IocContract) {}

  public register () {
    this.$container.singleton('Adonis/Core/CorsMiddleware', (app) => {
      const config = app.use('Adonis/Core/Config').get('cors', {})
      return new Cors(config)
    })
  }
}
