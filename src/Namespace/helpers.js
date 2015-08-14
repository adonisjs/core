'use strict'

/**
 * @author      - Harminder Virk
 * @package     - adonis-dispatcher
 * @description - Helpers for namespace store
 */

// importing libs
const Ioc = new (require('adonis-ioc-container').Ioc)
const _ = require('lodash')

// exporting helpers
let NamespaceHelpers = exports = module.exports = {}

/**
 * register recursive classes to ioc container
 * @param  {String} namespace
 * @param  {Array} modules
 */
NamespaceHelpers.register_to_ioc = function (namespace, modules) {
  _.each(modules, function (item, key) {
    if (typeof (item) === 'function') {
      Ioc.register(`${namespace}/${item.name}`, item)
    } else {
      NamespaceHelpers.register_to_ioc(`${namespace}/${key}`, item)
    }
  })
}

/**
 * add key value pairs to ioc container
 * @param  {String} key
 * @param  {Any} value
 */
NamespaceHelpers.map = function (key, value) {
  Ioc.map(key, value)
}

/**
 * destorys all mapping with ioc container
 */
NamespaceHelpers.clean_injector = function () {
  Ioc.destory()
}

/**
 * return list of mappings to the ioc container
 * @return {Object}
 */
NamespaceHelpers.ioc_list = function () {
  return Ioc.container._mappings
}

/**
 * resolve item and return instance of class from ioc container
 * @param  {String} namespace
 * @return {Class}
 */
NamespaceHelpers.resolve_from_ioc = function (namespace) {
  return Ioc.get(namespace)
}
