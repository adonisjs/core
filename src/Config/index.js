'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const autoLoad = require('auto-loader')
const _ = require('lodash')
const util = require('../../lib/util')

class Config {

  constructor (Helpers) {
    this.configPath = Helpers.configPath()
    this.config = _.fromPairs(_.compact(_.map(autoLoad.load(this.configPath), function (file, name) {
      if (name.endsWith('.js')) {
        return [name.replace('.js', ''), file]
      }
    })))
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
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    const returnValue = _.get(this.config, key)
    return util.existy(returnValue) ? returnValue : defaultValue
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
