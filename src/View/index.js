'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const edge = require('edge.js')
const BasePresenter = edge.BasePresenter

/**
 * View engine to be used for rendering views. It makes
 * use of Edge as the templating engine. Learn more
 * about edge [here](http://edge.adonisjs.com/)
 *
 * During HTTP request/response lifecycle, you should
 * make use of `view` instance to render views.
 *
 * @binding Adonis/Src/View
 * @singleton
 * @alias View
 * @group Http
 *
 * @class View
 * @constructor
 *
 * @example
 * ```js
 * Route.get('/', ({ view }) => {
 *   return view.render('home')
 * })
 * ```
 */
class View {
  constructor (Helpers, cacheViews = false) {
    edge.configure({
      cache: String(cacheViews) === 'true'
    })
    edge.registerViews(Helpers.viewsPath())
    edge.registerPresenters(Helpers.resourcesPath('presenters'))
    this.engine = edge
  }

  /**
   * Base presenter to be extended when creating
   * presenters for views.
   *
   * @attribute BasePresenter
   */
  get BasePresenter () {
    return BasePresenter
  }

  /**
   * Register global with the view engine.
   *
   * All parameters are directly
   * passed to http://edge.adonisjs.com/docs/globals#_adding_globals
   *
   *
   * @method global
   *
   * @param  {...Spread} params
   *
   * @return {void}
   */
  global (...params) {
    return this.engine.global(...params)
  }

  /**
   * Share an object as locals with the view
   * engine.
   *
   * All parameters are directly
   * passed to http://edge.adonisjs.com/docs/data-locals#_locals
   *
   * @method share
   *
   * @param  {...Spread} params
   *
   * @return {Object}
   */
  share (...params) {
    return this.engine.share(...params)
  }

  /**
   * Render a view from the `resources/views` directory.
   *
   * All parameters are directly
   * passed to http://edge.adonisjs.com/docs/getting-started#_rendering_template_files
   *
   * @method render
   *
   * @param  {...Spread} params
   *
   * @return {String}
   */
  render (...params) {
    return this.engine.render(...params)
  }

  /**
   * Renders a plain string
   *
   * All parameters are directly
   * passed to http://edge.adonisjs.com/docs/getting-started#_rendering_plain_string
   *
   * @method renderString
   *
   * @param  {...Spread}  params
   *
   * @return {String}
   */
  renderString (...params) {
    return this.engine.renderString(...params)
  }

  /**
   * Pass presenter to the view while rendering
   *
   * @method presenter
   *
   * @param  {...Spread} params
   *
   * @return {Object}
   */
  presenter (...params) {
    return this.engine.presenter(...params)
  }

  /**
   * Add a new tag to the view
   *
   * @method tag
   *
   * @param  {...Spread} params params
   *
   * @return {void}
   */
  tag (...params) {
    this.engine.tag(...params)
  }
}

module.exports = View
