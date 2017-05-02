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
  boot () {
    const Response = this.app.use('Adonis/Src/Response')

    /**
     * Registers an isolated instance of view on the
     * response object. Each view has access to
     * the request object.
     */
    Response.getter('viewInstance', function () {
      const View = use('Adonis/Src/View')
      return View.share({ request: this.request })
    }, true)

    /**
     * Also creating a macro on the response object, whose
     * job is to render the view using the viewInstance.
     */
    Response.macro('view', function (...params) {
      return this.viewInstance.render(...params)
    })
  }

  register () {
    this.app.singleton('Adonis/Src/View', (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = app.use('Adonis/Src/Config')

      const View = require('../src/View')
      return new View(Helpers, Config.get('app.views.cache'))
    })
  }
}

module.exports = ViewProvider
