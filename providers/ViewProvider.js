'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('adonis-fold')

class ViewProvider extends ServiceProvider {
  register () {
    this.app.singleton('Adonis/Src/View', (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = app.use('Adonis/Src/Config')

      const View = require('../src/View')
      return new View(Helpers, Config.get('app.views.cache'))
    })
  }

  boot () {
    const Context = this.app.use('Adonis/Src/Context')

    /**
     * Registers an isolated instance of view on the
     * response object. Each view has access to
     * the request object.
     */
    Context.getter('view', function () {
      const View = use('Adonis/Src/View')
      return View.share({ request: this.request })
    }, true)
  }
}

module.exports = ViewProvider
