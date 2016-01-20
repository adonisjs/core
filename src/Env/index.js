'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const dotenv = require('dotenv')
const util = require('../../lib/util')

class Env {

  constructor (Helpers) {
    dotenv.load({path: path.join(Helpers.basePath(), '.env')})
  }

  /**
   * @description get value of an existing key from
   * env file
   * @method get
   * @param  {String} key
   * @param  {Mixed} defaultValue
   * @return {Mixed}
   */
  get (key, defaultValue) {
    defaultValue = util.existy(defaultValue) ? defaultValue : null
    let returnValue = process.env[key] || defaultValue
    if (returnValue === 'true' || returnValue === '1') {
      return true
    }
    if (returnValue === 'false' || returnValue === '0') {
      return false
    }
    return returnValue
  }

  /**
   * @description set value of an existing .env variable
   * @method set
   * @param  {String} key
   * @param  {Mixed} value
   * @public
   */
  set (key, value) {
    process.env[key] = value
  }

}

module.exports = Env
