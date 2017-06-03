'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

let registeredDomains = []

let domains = exports = module.exports = {}

/**
 * pushes a new domain to registeredDomains
 *
 * @param  {String} domain
 *
 * @private
 */
domains.add = function (domain) {
  registeredDomains.push(domain)
}

/**
 * returns domains matching to a given
 * host
 *
 * @param  {String} host
 * @return {Boolean}
 *
 * @private
 */
domains.match = function (host) {
  let isDomain = false
  registeredDomains.forEach(function (domain) {
    if (domain.test(host)) {
      isDomain = true
    }
  })
  return isDomain
}
