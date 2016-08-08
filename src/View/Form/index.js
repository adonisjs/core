'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const _ = require('lodash')
const CE = require('../../Exceptions')

/**
 * Form helper for views
 * @class
 * @alias View.Form
 */
class Form {

  constructor (viewsEnv, Route) {
    this.env = viewsEnv
    this.specialKeywords = ['url', 'files', 'method', 'route', 'action', 'params']
    this.validFormMethods = ['GET', 'POST']
    this.route = Route
  }

  /**
   * returns method to be used for
   * submitting forms
   *
   * @param  {String}   method
   * @return {String}
   *
   * @private
   */
  _getMethod (method) {
    if (!method) {
      return 'POST'
    }
    method = method.toUpperCase()
    return this.validFormMethods.indexOf(method) > -1 ? method : 'POST'
  }

  /**
   * returns url to be set as form action
   *
   * @param  {Object} options
   * @return {String}
   *
   * @private
   */
  _getUrl (options) {
    let url = options.url
    if (options.route) {
      url = this.env.filters.route(options.route, options.params)
    }
    return url
  }

  /**
   * makes html attributes from an object
   *
   * @param  {Object}            attributes
   * @param  {Array}             [avoid=[]]
   * @return {Array}
   *
   * @private
   */
  _makeHtmlAttributes (attributes, avoid) {
    avoid = avoid || []
    const htmlAttributes = []
    _.each(attributes, (value, index) => {
      if (avoid.indexOf(index) <= -1 && value !== null && value !== undefined) {
        htmlAttributes.push(`${index}="${value}"`)
      }
    })
    return htmlAttributes
  }

  /**
   * returns enctype to be used for submitting form
   *
   * @param  {Boolean}    files
   * @return {String}
   *
   * @private
   */
  _getEncType (files) {
    return files ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
  }

  /**
   * adds query string for method spoofing if method is other
   * than get and post
   *
   * @param  {String}               method
   * @param  {String}               url
   * @return {String}
   *
   * @private
   */
  _makeMethodQueryString (method, url) {
    if (this.validFormMethods.indexOf(method) > -1) {
      return url
    }
    const symbol = url.indexOf('?') > -1 ? '&' : '?'
    return `${url}${symbol}_method=${method.toUpperCase()}`
  }

  /**
   * make options attributes for the options tag
   *
   * @param  {Mixed}               value
   * @param  {Array}               selected
   * @return {String}
   *
   * @private
   */
  _makeOptionsAttributes (value, selected) {
    const attributes = {
      selected: selected.indexOf(value) > -1 ? true : null,
      value: value
    }
    return this._makeHtmlAttributes(attributes).join(' ')
  }

  /**
   * make options tag
   *
   * @param  {Array|Object}     options
   * @param  {Array|String}     selected
   * @return {Array}
   *
   * @private
   */
  _makeOptions (options, selected) {
    selected = _.isArray(selected) ? selected : [selected]

    if (_.isArray(options)) {
      return _.map(options, (option) => {
        return `<option ${this._makeOptionsAttributes(option, selected)}> ${option} </option>`
      })
    }
    return _.map(options, (option, key) => {
      return `<option ${this._makeOptionsAttributes(key, selected)}> ${option} </option>`
    })
  }

  /**
   * open a form tag and sets it's action,method
   * enctype and other attributes
   * @param  {Object} options - options to be used in order to create
   *                            form tag
   * @return {Object} - view specific object
   *
   * @example
   * Form.open({url: '/user/:id', method: 'PUT', params: {id: 1}})
   * Form.open({route: 'user.update', method: 'PUT', params: {id: 1}})
   * Form.open({action: 'UserController.update', method: 'PUT', params: {id: 1}})
   *
   * @public
   */
  open (options) {
    /**
     * if user has defined route, fetch actual
     * route defination using Route module
     * and use the method.
     */
    if (options.route) {
      const route = this.route.getRoute({ name: options.route })

      if (route === void 0) {
        throw CE.RuntimeException.missingRoute(options.route)
      }

      options.method = route.verb[0]
    }

    /**
     * if user has defined action, fetch actual
     * route defination using Route module
     * and use the method and route.
     */
    if (options.action) {
      const route = this.route.getRoute({handler: options.action})

      if (route === void 0) {
        throw CE.RuntimeException.missingRouteAction(options.action)
      }

      options.method = route.verb[0]
      options.route = route.route
    }

    let url = this._getUrl(options)
    const actualMethod = options.method || 'POST'
    const method = this._getMethod(actualMethod)
    const enctype = this._getEncType(options.files)
    url = this._makeMethodQueryString(actualMethod, url)
    let formAttributes = []

    formAttributes.push(`method="${method}"`)
    formAttributes.push(`action="${url}"`)
    formAttributes.push(`enctype="${enctype}"`)
    formAttributes = formAttributes.concat(this._makeHtmlAttributes(options, this.specialKeywords))
    return this.env.filters.safe(`<form ${formAttributes.join(' ')}>`)
  }

  /**
   * closes the form tag
   *
   * @method close
   *
   * @return {Object}
   *
   * @public
   */
  close () {
    return this.env.filters.safe('</form>')
  }

  /**
   * creates a label field
   *
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} [attributes={}]
   * @return {Object}
   *
   * @example
   * Form.label('email', 'Enter your email address')
   * Form.label('email', 'Enter your email address', {class: 'bootstrap-class'})
   *
   * @public
   */
  label (name, value, attributes) {
    attributes = attributes || {}
    value = value || name
    const labelAttributes = [`name="${name}"`].concat(this._makeHtmlAttributes(attributes))
    return this.env.filters.safe(`<label ${labelAttributes.join(' ')}> ${value} </label>`)
  }

  /**
   * creates an input field with defined type and attributes.
   * Also it will use old values if flash middleware is
   * enabled.
   *
   * @param  {String} type
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   *
   * form.input('text', 'username', '', {class: 'input'})
   */
  input (type, name, value, attributes) {
    attributes = attributes || {}
    attributes.id = attributes.id || name

    if (!value && this.env.globals.old && !attributes.avoidOld) {
      value = this.env.globals.old(name)
    }
    attributes.avoidOld = null

    if (type === 'textarea') {
      const textareaAttributes = [`name="${name}"`].concat(this._makeHtmlAttributes(attributes))
      value = value || ''
      return this.env.filters.safe(`<textarea ${textareaAttributes.join(' ')}>${value}</textarea>`)
    }

    let inputAttributes = [`type="${type}"`, `name="${name}"`]
    if (value) {
      inputAttributes.push(`value="${value}"`)
    }
    inputAttributes = inputAttributes.concat(this._makeHtmlAttributes(attributes))
    return this.env.filters.safe(`<input ${inputAttributes.join(' ')} />`)
  }

  /**
   * creates a text input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.text('username', '', {id: 'profile-username'})
   *
   * @public
   */
  text (name, value, attributes) {
    return this.input('text', name, value, attributes)
  }

  /**
   * creates a submit input field with name, value
   * and other input attributes
   * @method submit
   * @param  {String} value
   * @param  {String} name
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.submit('Click Me', null, {class: 'button-primary'})
   *
   * @public
   */
  submit (value, name, attributes) {
    name = name || 'submit'
    return this.input('submit', name, value, attributes)
  }

  /**
   * creates a button element with name, value and other
   * other button attributes
   * @method button
   * @param  {String} value
   * @param  {String} [name=submit]
   * @param  {Object} [attributes={}]
   * @return {Object}
   *
   * @example
   * form.button('Submit')
   * form.button('Create Account', 'create-account')
   * form.button('Submit', null, {class: 'button--large'})
   *
   * @public
   */
  button (value, name, attributes) {
    attributes = attributes || {}
    let type = 'submit'
    if (attributes.type) {
      type = attributes.type
      attributes.type = null
    }
    name = name || type
    attributes.id = attributes.id || name
    const buttonAttributes = [`type="${type}"`, `name="${name}"`, `value="${value}"`].concat(this._makeHtmlAttributes(attributes))
    return this.env.filters.safe(`<button ${buttonAttributes.join(' ')}> ${value} </button>`)
  }

  /**
   * creates a button element as with reset type.
   * @method resetButton
   * @param  {String} value
   * @param  {String} [name=submit]
   * @param  {Object} [attributes={}]
   * @return {Object}
   *
   * @example
   * form.button('Submit')
   * form.button('Create Account', 'create-account')
   * form.button('Submit', null, {class: 'button--large'})
   *
   * @public
   */
  resetButton (value, name, attributes) {
    attributes = attributes || {}
    attributes.type = 'reset'
    return this.button(value, name, attributes)
  }

  /**
   * creates a password input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.password('password', '', {})
   *
   * @public
   */
  password (name, value, attributes) {
    return this.input('password', name, value, attributes)
  }

  /**
   * creates an email input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.email('email', '', {})
   *
   * @public
   */
  email (name, value, attributes) {
    return this.input('email', name, value, attributes)
  }
  /**
   * creates a file input field
   * @param  {String} name
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.file('password', {})
   *
   * @public
   */
  file (name, attributes) {
    return this.input('file', name, null, attributes)
  }

  /**
   * creates a color input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.color('theme-color', '#ffffff', {})
   *
   * @public
   */
  color (name, value, attributes) {
    return this.input('color', name, value, attributes)
  }

  /**
   * creates a date input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.date('theme-color', '', {})
   *
   * @public
   */
  date (name, value, attributes) {
    return this.input('date', name, value, attributes)
  }

  /**
   * creates a url input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.url('profile', '', {})
   *
   * @public
   */
  url (name, value, attributes) {
    return this.input('url', name, value, attributes)
  }

  /**
   * creates a search input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.search('search', '', {})
   *
   * @public
   */
  search (name, value, attributes) {
    return this.input('search', name, value, attributes)
  }

  /**
   * creates a hidden input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.hidden('token', '', {})
   *
   * @public
   */
  hidden (name, value, attributes) {
    return this.input('hidden', name, value, attributes)
  }

  /**
   * creates a textarea field
   * @param  {String} name
   * @param  {String} value
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.hidden('token', '', {})
   *
   * @public
   */
  textarea (name, value, attributes) {
    return this.input('textarea', name, value, attributes)
  }

  /**
   * creates a radio input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Boolean} checked - input to be checked or not
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.radio('gender', 'male', true, {})
   * form.radio('gender', 'female')
   *
   * @public
   */
  radio (name, value, checked, attributes) {
    attributes = attributes || {}
    attributes.checked = checked ? 'checked' : null
    return this.input('radio', name, value, attributes)
  }

  /**
   * creates a checkbox input field
   * @param  {String} name
   * @param  {String} value
   * @param  {Boolean} checked - input to be checked or not
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   * form.checkbox('terms', 'agree')
   *
   * @public
   */
  checkbox (name, value, checked, attributes) {
    attributes = attributes || {}
    attributes.checked = checked ? 'checked' : null
    return this.input('checkbox', name, value, attributes)
  }

  /**
   * creates a new select box
   *
   * @param  {String} name
   * @param  {Object|Array} options
   * @param  {String|Array} selected
   * @param  {String} emptyOption
   * @param  {Object} attributes
   * @return {Object}
   *
   * @example
   *
   * form.select('country', ['India', 'Us', 'France'])
   * form.select('country', {ind: 'India', us: 'Us', fr: 'France'}, ['ind', 'us'])
   * form.select('country', ['India', 'Us', 'France'], null, 'Select Country')
   *
   * @public
   */
  select (name, options, selected, emptyOption, attributes) {
    attributes = attributes || {}
    attributes.id = attributes.id || name
    let selectAttributes = [`name="${name}"`]
    selectAttributes = selectAttributes.concat(this._makeHtmlAttributes(attributes))
    let selectTag = `<select ${selectAttributes.join(' ')}>\n`
    if (emptyOption) {
      selectTag += this._makeOptions({'': emptyOption})[0] + '\n'
    }
    selectTag += this._makeOptions(options, selected).join('\n')
    selectTag += '\n</select>'
    return this.env.filters.safe(selectTag)
  }

  /**
   * creates a select box with options in a defined range
   * @param  {String}    name
   * @param  {Number}    start
   * @param  {Number}    end
   * @param  {Number|Array}    selected
   * @param  {String}    emptyOption
   * @param  {Object}    attributes
   * @return {Object}
   *
   * @example
   * form.selectRange('shoesize', 4, 12, 7, 'Select shoe size')
   *
   * @public
   */
  selectRange (name, start, end, selected, emptyOption, attributes) {
    return this.select(name, _.range(start, end), selected, emptyOption, attributes)
  }

}

module.exports = Form
