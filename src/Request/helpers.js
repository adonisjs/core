"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Helper methods for Request class
 */

// importing libs
const _ = require("lodash"),
  accepts = require("accepts"),
  is = require("type-is");


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



/**
 * checks best possible return type for a request
 * @param  {Object} req 
 * @param  {Array} types
 * @return {String}
 */
RequestHelpers.check_http_accept_field = function(req, types) {
  let accept = accepts(req);
  return accept.type(types);
}


/**
 * check request content-type header
 * @param  {Object} req 
 * @param  {Array} types
 * @return {String}
 */
RequestHelpers.check_http_content_type = function(req, types) {
  let type = is.is(req, types);
  return _.contains(types,type);
}
