'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

const bcrypt = require('bcryptjs')

let Hash = exports = module.exports = {}

/**
 * @description hash a value with given number of rounds
 * @method make
 * @param  {String} value
 * @param  {Number} rounds
 * @return {Object}
 * @public
 */
Hash.make = function (value, rounds) {
  rounds = rounds || 10
  return new Promise(function (resolve, reject) {
    bcrypt.hash(value, rounds, function (error, hash) {
      if (error) {
        return reject(error)
      }
      resolve(hash)
    })
  })
}

/**
 * @description verifies a given value against hash value
 * @method verify
 * @param  {String} value
 * @param  {String} hash
 * @return {Object}
 * @public
 */
Hash.verify = function (value, hash) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(value, hash, function (error, response) {
      if (error) {
        return reject(error)
      }
      resolve(response)
    })
  })
}
