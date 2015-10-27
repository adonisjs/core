'use strict'

/**
 * adonis-fold
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

/**
 * @ignore
*/
const Ioc = require('../Ioc')

/**
 * @class  ServiceProvider
 * @description Base class to be extended while creating
 * service providers.
 * @public
 */
class ServiceProvider {

  constructor () {
    this.app = Ioc
  }

}

module.exports = ServiceProvider
