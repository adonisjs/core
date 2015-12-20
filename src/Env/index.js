'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const path = require('path')
const dotenv = require('dotenv')

class Env {

  constructor (Helpers) {
    const basePath = Helpers.basePath()
    const pathToEnvFile = path.join(basePath, '.env')
    dotenv.load({path:pathToEnvFile})
  }

  /**
   * @description tells whether value exists or not by checking
   * it type
   * @method existy
   * @param  {Mixed} value
   * @return {Boolean}
   */
  existy (value) {
    return typeof(value) !== 'undefined' && typeof(value) !== 'null'
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
    defaultValue = exis.existy(defaultValue) ? defaultValue : null
    let returnValue = process.env[key] || defaultValue
    if(returnValue === 'true' || returnValue === '1'){
      return true
    }
    if(returnValue === 'false' || returnValue === '0'){
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
