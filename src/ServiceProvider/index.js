'use strict'

/**
 * Service provider is the base class to be extended by all
 * the providers. Each provider can have register and boot
 * methods which are called by the Registrar class as
 * part of lifecycle hooks.
 *
 * @class ServiceProvider
 */
class ServiceProvider {
  constructor (Ioc) {
    /**
     * Reference to the Ioc container
     * @attribute app
     */
    this.app = Ioc
  }
}

module.exports = ServiceProvider
