'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nunjucks = require('nunjucks')
const ViewLoader = require('./loader')
const viewFilters = require('./filters')
const viewGlobals = require('./globals')
const _ = require('lodash')

/**
 * View class for adonis framework to serve jinja like views
 * @class
 * @alias View
 */
class View {

  constructor (Helpers, Config, Route, viewsEnv) {
    this.Helpers = Helpers
    this.Config = Config
    this.Route = Route
    nunjucks.nodes.For = nunjucks.nodes.AsyncEach // monkey patch for with asyncEach
    const viewsPath = Helpers.viewsPath()
    const viewsCache = Config.get('app.views.cache', true)
    const injectServices = Config.get('app.views.injectServices', false)
    this.viewsEnv = viewsEnv || new nunjucks.Environment(new ViewLoader(viewsPath, false, !viewsCache))

    /**
     * only register use, make and yield when the end user
     * has enabled injectServices inside the config file.
     */
    if (injectServices) {
      require('./services')(this.viewsEnv)
    }

    viewGlobals(this.viewsEnv, Route)
    viewFilters(this.viewsEnv, Route)
  }

  /**
   * compile a view with give template and data
   *
   * @param  {String} template_path
   * @param  {Object} [data]
   * @return {Promise}
   *
   * @example
   * View
   *   .make('index', {})
   *   .then()
   *   .catch()
   * @public
   */
  make (templatePath, data) {
    let self = this
    return new Promise(function (resolve, reject) {
      self.viewsEnv.render(templatePath, data, function (err, templateContent) {
        if (err) {
          reject(err)
          return
        }
        resolve(templateContent)
      })
    })
  }

  /**
   * makes a view from string instead of path, it is
   * helpful for making quick templates on the
   * fly.
   *
   * @param  {String}   templateString
   * @param  {Object}   [data]
   * @return {String}
   *
   * @example
   * view.makeString('Hello {{ user }}', {user: 'doe'})
   *
   * @public
   */
  makeString (templateString, data) {
    return this.viewsEnv.renderString(templateString, data)
  }

  /**
   * add a filter to view, it also support async execution
   *
   * @param  {String}   name
   * @param  {Function} callback
   * @param  {Boolean}   async
   *
   * @example
   * View.filter('name', function () {
   * }, true)
   *
   * @public
   */
  filter (name, callback, async) {
    this.viewsEnv.addFilter(name, callback, async)
  }

  /**
   * add a global method to views
   *
   * @param  {String} name
   * @param  {Mixed} value
   *
   * @example
   * View.global('key', value)
   *
   * @public
   */
  global (name, value) {
    this.viewsEnv.addGlobal(name, value)
  }

  /**
   * Returns a cloned instance of itself to be used for
   * having isoloted instance of views. This is required
   * to attach globals during request lifecycle.
   *
   * @method clone
   *
   * @return {Object}
   */
  clone () {
    return new View(this.Helpers, this.Config, this.Route, _.cloneDeep(this.viewsEnv))
  }
}

module.exports = View
