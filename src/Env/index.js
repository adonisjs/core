'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-http-dispatcher
 * @description - Loads .env file into process.env for managing environment
 */

// importing libs
const dotenv = require('dotenv')
const Logger = require('../Logger')

function Env(path_to_env_file){
  Logger.verbose(`loading environment config from ${path_to_env_file}`)
  dotenv.config({
    path: path_to_env_file
  })
}

/**
 * get value of a defined key on process.emv
 * @param  {String} key
 * @return {Any}
 */
Env.prototype.get = function (key) {
  return process.env[key]
}

/**
 * sets key/value pair on proccess.env
 * @param {String} key
 * @param {Any} value
 */
Env.prototype.set = function (key, value) {
  process.env[key] = value
}

module.exports = Env
