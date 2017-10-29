'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class ViewProvider extends ServiceProvider {
  /**
   * Register method called by the Ioc container
   * to register the provider
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('Adonis/Src/View', (app) => {
      const Helpers = app.use('Adonis/Src/Helpers')
      const Config = app.use('Adonis/Src/Config')

      const View = require('../src/View')
      return new View(Helpers, Config.get('app.views.cache'))
    })
    this.app.alias('Adonis/Src/View', 'View')
  }

  /**
   * Boot method called by the Ioc container to
   * boot the provider
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    const Context = this.app.use('Adonis/Src/HttpContext')
    const View = this.app.use('Adonis/Src/View')
    const Config = this.app.use('Adonis/Src/Config')
    const Route = this.app.use('Adonis/Src/Route')
    const Helpers = this.app.use('Adonis/Src/Helpers')

    /**
     * Registering wildely available globals
     */
    require('../src/View/globals')(View, Route, Config)

    /**
     * Registering view tags
     */
    require('../src/View/Tags')(View, Helpers)

    /**
     * Registers an isolated instance of view on the
     * response object. Each view has access to
     * the request object.
     */
    Context.getter('view', function () {
      return View.share({})
    }, true)
  }
}

module.exports = ViewProvider
