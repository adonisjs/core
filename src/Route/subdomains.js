'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2016 Harminder Virk
 * MIT Licensed
*/

let registeredDomains = []

let subdomains = exports = module.exports = {}

/**
 * @description register a new subdomain
 * @method add
 * @param  {String} domain
 */
subdomains.add = function (domain) {
  registeredDomains.push(domain)
}

/**
 * @description returns subdomain matching to a given
 * host
 * @method match
 * @param  {String} host
 * @return {Boolean}
 * @public
 */
subdomains.match = function (host) {
  let is_subdomain = false
  for (let x = 0; x < registeredDomains.length; x++) {
    let domain = registeredDomains[x]
    if (domain.test(host)) {
      is_subdomain = true
      break
    }
  }
  return is_subdomain
}
