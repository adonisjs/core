'use strict'

/**
 * adonis-http-dispatcher
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

// importing libs
const dotenv = require('dotenv')
const Logger = require('../Logger')
const path = require('path')

function Env (Helpers) {
  const basePath = Helpers.basePath()
  const pathToEnvFile = path.join(basePath, '.env')
  Logger.verbose(`loading environment config from ${pathToEnvFile}`)
  dotenv.config({
    path: pathToEnvFile
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
