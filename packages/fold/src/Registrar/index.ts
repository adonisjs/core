/**
 * @module main
 */

/*
* @adonisjs/fold
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { ServiceProvider, IoC } from '../Contracts'

export class Registrar {
  private _providersPaths: string[]

  constructor (public ioc: IoC) {
  }

  /**
   * Load the provider by requiring the file from the disk
   * and instantiate it. If ioc container is using ES6
   * imports, then default exports are handled
   * automatically.
   */
  private _loadProvider (providerPath: string): ServiceProvider {
    const provider = require(providerPath)

    return (this.ioc.es6Imports && provider.default
      ? new provider.default(this.ioc)
      : new provider(this.ioc)) as ServiceProvider
  }

  /**
   * Register an array of provider paths
   */
  public useProviders (providersPaths: string[]): this {
    this._providersPaths = providersPaths
    return this
  }

  /**
   * Register all the providers by instantiating them and
   * calling the `register` method.
   *
   * The provider instance will be returned, which can be used
   * to boot them as well.
   */
  public register (): ServiceProvider[] {
    return this._providersPaths.map((providerPath) => {
      const provider = this._loadProvider(providerPath)

      /* istanbul ignore else */
      if (typeof (provider.register) === 'function') {
        provider.register()
      }

      return provider
    })
  }

  /**
   * Boot all the providers by calling the `boot` method.
   * Boot methods are called in series.
   */
  public async boot (providers: ServiceProvider[]) {
    for (let provider of providers) {
      /* istanbul ignore else */
      if (typeof (provider.boot) === 'function') {
        await provider.boot()
      }
    }
  }

  /**
   * Register an boot providers together.
   */
  public async registerAndBoot (): Promise<ServiceProvider[]> {
    const providers = this.register()
    await this.boot(providers)
    return providers
  }
}
