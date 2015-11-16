'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const autoLoad = require('auto-loader')
const _ = require('lodash')

class Config {

  constructor (Helpers) {
    this.configPath = Helpers.configPath()
    this.config = autoLoad.load(this.configPath)
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
    defaultValue = defaultValue || null
    return _.get(this.config, key) || defaultValue
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
