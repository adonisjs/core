'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const autoLoad = require('auto-loader')
const _ = require('lodash')

class Config {

  constructor (Helpers) {
    this.configPath = Helpers.configPath()
    this.config = autoLoad.load(this.configPath)
  }

  /**
   * @description tells whether value exists or not by checking
   * it type
   * @method existy
   * @param  {Mixed} value
   * @return {Boolean}
   */
  existy (value) {
    return value !== undefined && value !== null
  }

  /**
   * @description get value for a given key from config store
   * @method get
   * @param  {String} key
   * @param  {Mixed} defaultValue
   * @return {Mixed}
   * @public
   */
  get (key, defaultValue) {
    defaultValue = this.existy(defaultValue) ? defaultValue : null
    const returnValue = _.get(this.config, key)
    return this.existy(returnValue) ? returnValue : defaultValue
  }

  /**
   * @description set/update value for a given key inside
   * config store
   * @method set
   * @param  {String} key
   * @param  {Mixed} value
   * @public
   */
  set (key, value) {
    _.set(this.config, key, value)
  }
}

module.exports = Config
