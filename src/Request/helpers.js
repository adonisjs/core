"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Helper methods for Request class
 */

// importing libs
let _ = require("lodash");


// exporting helpers 
let RequestHelpers = exports = module.exports = {};



/**
 * return values from object based upon requested keys
 * @param  {Object} hash
 * @param  {Array} keys
 * @return {Object}  
 */
RequestHelpers.return_requested_keys_from_object = function(hash, keys) {
  if (_.size(keys) == 0) {
    return hash;
  }

  let filteredValues = {};

  _.map(keys, function(arg) {
    if (!hash[arg]) hash[arg] = null
    filteredValues[arg] = hash[arg];
  })

  return filteredValues;
}


/**
 * remove request keys from object and return remaining data
 * @param  {Object} hash
 * @param  {Array} keys
 * @return {Object}
 */
RequestHelpers.remove_requested_keys_from_object = function(hash, keys) {
  if (_.size(keys) === 0) {
    return hash
  }
  return _.omit(hash, keys);
}