"use strict";

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Namespaces store injects class to Ioc and maintains reference to them
 *                as store key.
 */


// holding references to namespaces
let namespaces = [];


// importing libraries
let _ = require("lodash"),
  loader = require("auto-loader"),
  Logger = require("../Logger"),
  helpers = require("./helpers");


// exporting namespace
let Namespace = exports = module.exports = {};



/**
 * add item to namespace store and ioc container
 * @param {String} key
 * @param {String} value
 */
Namespace.add = function(key, value) {
  namespaces.push({
    key, value
  });
  helpers.map(key, value);
  return this;
}



/**
 * register bunch of classes to ioc container and map to 
 * predefined namespace
 * @param  {String} path_to_deps
 */
Namespace.register = function(path_to_deps) {
  let lastItem = _.last(namespaces);
  if (lastItem) {
    Logger.verbose(`registering modules under ${path_to_deps} to ${lastItem.value} namespace`);
    let items = loader.load(path_to_deps);
    return helpers.register_to_ioc(lastItem.value, items);
  }
  Logger.warn("unable to register , make sure to add key/value pair to namespace store");
}



/**
 * return list of mappings to ioc container
 * @return {Object}
 */
Namespace.list = function() {
  return helpers.ioc_list();
}



/**
 * return class instance from ioc container based on keys
 * @param  {String} key namespace store key
 * @return {Object}
 */
Namespace.resolve = function(name, identity) {
  if (identity) {
    let namespace = _.filter(namespaces, function(item) {
      return item.key === identity
    });
    if (_.size(namespace) === 0) {
      return new Promise(function(resolve, reject) {
        reject(`unable to resolve ${name} from ${identity}`)
      });
    }
    name = `${namespace[0].value}/${name}`;
  }
  return helpers.resolve_from_ioc(name);
}
