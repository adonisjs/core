"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Middlewares stack store for adonis
 */


// importing libs
const _ = require("lodash");


// storing reference to global and named middlewares
let global_middlewares = [],
  named_middlewares = [];


// exporting Middlewares
let Middlewares = exports = module.exports = {};


/**
 * clear middlewares stack
 */
Middlewares.clear = function() {
  global_middlewares = []
  named_middlewares = [];
}


/**
 * register global middlewares to stack
 * @param  {Array} array_of_middlewares
 */
Middlewares.global = function(array_of_middlewares) {
  global_middlewares = array_of_middlewares
}



/**
 * register named middlewares to stack
 * @param  {Object} object_of_named_middlewares
 */
Middlewares.named = function(object_of_named_middlewares) {
  named_middlewares = object_of_named_middlewares;
}



/**
 * returns all global and request named middlewares
 * @param  {Array} keys
 * @return {Array}
 */
Middlewares.get = function(keys) {
  let named = _.pick(named_middlewares, keys);
  named = _.size(named) > 0 ? _.values(named) : [];
  return _(global_middlewares).concat(named).value();
}



/**
 * return filtered middlewares with one who has handle method
 * @param  {Array} array_of_middlewares
 * @return {Object}
 */
Middlewares.filter = function(array_of_middlewares) {
  return _.compact(_.map(array_of_middlewares, function(middleware) {
    if (typeof(middleware) === 'function' && typeof(middleware.prototype) === 'object') {
      let invoke = new middleware;
      if (typeof(invoke.handle) !== 'undefined') {
        return invoke;
      }
    }
  }));
}