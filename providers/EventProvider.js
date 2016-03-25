'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class EventProvider extends ServiceProvider {

  * register () {
    this.app.singleton('Adonis/Src/Event', function (app) {
      const Event = require('../src/Event')
      const Config = app.use('Adonis/Src/Config')
      const Helpers = app.use('Adonis/Src/Helpers')
      return new Event(Config, Helpers)
    })
  }
}

module.exports = EventProvider
