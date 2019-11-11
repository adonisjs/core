/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { join } from 'path'
import findPkg from 'find-package-json'
import { Exception } from '@poppinss/utils'
import { Ioc, Registrar } from '@adonisjs/fold'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Application } from '@adonisjs/application/build/standalone'

import { optionalRequire } from '../utils'

/**
 * Exposes the API to bootstrap the application by registering-booting the
 * providers, require preloads and so on.
 */
export class Bootstrapper {
  /**
   * Reference to the application
   */
  private _application: ApplicationContract

  /**
   * Reference to registrar
   */
  private _registrar: Registrar

  /**
   * Reference to the logger, will be set once providers
   * have been registered.
   */
  private _logger?: LoggerContract

  constructor (private _appRoot: string) {
  }

  /**
   * Setup the Ioc container globals and the application. This lays
   * off the ground for not having `global.use` runtime errors.
   */
  public setup (): ApplicationContract {
    const ioc = new Ioc()

    /**
     * Adding IoC container resolver methods to the globals.
     */
    global[Symbol.for('ioc.use')] = ioc.use.bind(ioc)
    global[Symbol.for('ioc.make')] = ioc.make.bind(ioc)
    global[Symbol.for('ioc.call')] = ioc.call.bind(ioc)

    const adonisCorePkgFile = findPkg(join(__dirname, '..', '..')).next().value
    const appPkgFile = findPkg(this._appRoot).next().value

    const pkgFile = {
      name: appPkgFile.name,
      version: appPkgFile.version,
      adonisVersion: adonisCorePkgFile.version,
    }

    /**
     * Setting up the application and binding it to the container as well. This makes
     * it's way to the container even before the providers starts registering
     * themselves.
     */
    this._application = new Application(
      this._appRoot,
      ioc,
      optionalRequire(join(this._appRoot, '.adonisrc.json'), true) || {},
      pkgFile,
    )

    this._registrar = new Registrar(ioc)

    ioc.singleton('Adonis/Core/Application', () => this._application)
    return this._application
  }

  /**
   * Returns providers, aceProviders, aliases and commands from the
   * start/app file
   */
  public getAppFileContents () {
    const appExports = require(this._application.startPath('app'))

    /**
     * Validate the required props to ensure they exists
     */
    const requiredExports = ['providers']
    requiredExports.forEach((prop) => {
      if (!appExports[prop]) {
        throw new Exception(
          `export \`${prop}\` array from start/app file`,
          500,
          'E_MISSING_APP_ESSENTIALS',
        )
      }
    })

    return {
      providers: appExports.providers || [],
      aceProviders: appExports.aceProviders || [],
      aliases: appExports.aliases || {},
      commands: appExports.commands || [],
    }
  }

  /**
   * Register the providers and their aliases to the IoC container.
   */
  public registerProviders (includeAce: boolean) {
    const { providers, aceProviders, aliases } = this.getAppFileContents()
    const providersList = (includeAce ? providers.concat(aceProviders) : providers).filter((provider) => {
      return !!provider
    })

    const providersRefs = this._registrar.useProviders(providersList).register()
    Object.keys(aliases).forEach((alias) => {
      this._application.container.alias(aliases[alias], alias)
    })

    this._logger = this._application.container.use('Adonis/Core/Logger')
    return providersRefs
  }

  /**
   * Registers autoloading directories
   */
  public registerAutoloads () {
    this._application.autoloadsMap.forEach((toPath, alias) => {
      if (this._logger) {
        this._logger.trace(`registering %s under %s alias`, toPath, alias)
      }
      this._application.container.autoload(join(this._application.appRoot, toPath), alias)
    })
  }

  /**
   * Requires preloads
   */
  public registerPreloads () {
    this._application.preloads
      .filter((node) => {
        if (!node.environment || this._application.environment === 'unknown') {
          return true
        }

        return node.environment.indexOf(this._application.environment) > -1
      })
      .forEach((node) => {
        if (this._logger) {
          this._logger.trace(`preloading %s file`, node.file)
        }
        optionalRequire(join(this._application.appRoot, node.file), node.optional)
      })
  }

  /**
   * Boot providers by invoking `boot` method on them
   */
  public async bootProviders () {
    await this._registrar.boot()
  }
}
