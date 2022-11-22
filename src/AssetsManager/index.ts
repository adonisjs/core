/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'
import stringifyAttributes from 'stringify-attributes'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import {
  ExtendCallback,
  AssetsManagerConfig,
  AssetsDriverContract,
  AssetsManagerContract,
} from '@ioc:Adonis/Core/AssetsManager'

import { FakeDriver } from './Drivers/Fake'
import { EncoreDriver } from './Drivers/Encore'
import { ViteDriver } from './Drivers/Vite'

/**
 * Assets manager exposes the API to make link and HTML fragments
 * for static assets.
 *
 * The compilation is not done by the assets manager. It must be done
 * separately
 */
export class AssetsManager implements AssetsManagerContract {
  private drivers: Record<string, ExtendCallback> = {
    vite: () => new ViteDriver(this.application),
    encore: () => new EncoreDriver(this.application),
    fake: () => new FakeDriver(this.application),
  }

  /**
   * Attributes to apply to the script tag
   */
  public get scriptAttributes(): Record<string, any> {
    return this.driver.scriptAttributes
  }

  /**
   * Configured driver
   */
  private driver: AssetsDriverContract
  private booted: boolean = false

  /**
   * Find if the configured driver supports entrypoints or not
   */
  public get hasEntrypoints() {
    this.boot()
    return this.driver.hasEntrypoints
  }

  /**
   * Path to the public output directory. The property must be
   * mutable
   */
  public get publicPath() {
    this.boot()
    return this.driver.publicPath
  }

  /**
   * Returns the current version of assets
   */
  public get version() {
    this.boot()
    return this.driver.version
  }

  /**
   * Returns the name of the driver currently in use
   */
  public get name() {
    this.boot()
    return this.driver.name
  }

  constructor(private config: AssetsManagerConfig, public application: ApplicationContract) {}

  /**
   * Boot the manager. Must be done lazily to allow `extend` method to takes
   * in effect.
   */
  private boot() {
    if (this.booted) {
      return false
    }

    this.booted = true
    const driver = this.config.driver || 'encore'

    /**
     * Ensure driver name is recognized
     */
    if (!this.drivers[driver]) {
      throw new Exception(
        `Invalid asset driver "${driver}". Make sure to register the driver using the "AssetsManager.extend" method`
      )
    }

    /**
     * Configure the driver
     */
    this.driver = this.drivers[driver](this, this.config)

    /**
     * Configure the public path
     */
    if (this.config.publicPath) {
      this.driver.publicPath = this.config.publicPath
    }
  }

  /**
   * Ensure entrypoints are enabled, otherwise raise an exception. The
   * methods relying on the entrypoints file uses this method
   */
  private ensureHasEntryPoints() {
    if (!this.hasEntrypoints) {
      throw new Error(
        `Cannot reference entrypoints. The "${this.driver.name}" driver does not support entrypoints`
      )
    }
  }

  /**
   * Returns the manifest contents as an object
   */
  public manifest() {
    this.boot()
    return this.driver.manifest()
  }

  /**
   * Returns path to a given asset entry
   */
  public assetPath(filename: string): string {
    this.boot()
    return this.driver.assetPath(filename)
  }

  /**
   * Returns the entrypoints contents as an object
   */
  public entryPoints() {
    this.boot()
    this.ensureHasEntryPoints()
    return this.driver.entryPoints!()
  }

  /**
   * Returns list for all the javascript files for a given entry point.
   * Raises exceptions when [[hasEntrypoints]] is false
   */
  public entryPointJsFiles(name: string): string[] {
    this.boot()
    this.ensureHasEntryPoints()
    return this.driver.entryPointJsFiles!(name)
  }

  /**
   * Returns list for all the css files for a given entry point.
   * Raises exceptions when [[hasEntrypoints]] is false
   */
  public entryPointCssFiles(name: string): string[] {
    this.boot()
    this.ensureHasEntryPoints()
    return this.driver.entryPointCssFiles!(name)
  }

  /**
   * Returns an HTML fragment for script tags. Raises exceptions
   * when [[hasEntrypoints]] is false
   */
  public entryPointScriptTags(name: string): string {
    const scripts = this.entryPointJsFiles(name)
    const configDefinedAttributes = this.config.script?.attributes || {}
    const driverDefinedAttributes = this.driver.scriptAttributes || {}

    const mergedAttributes = {
      ...configDefinedAttributes,
      ...driverDefinedAttributes,
    }

    return scripts
      .map((url) => `<script src="${url}"${stringifyAttributes(mergedAttributes)}></script>`)
      .join('\n')
  }

  /**
   * Returns an HTML fragment for stylesheet link tags. Raises exceptions
   * when [[hasEntrypoints]] is false
   */
  public entryPointStyleTags(name: string): string {
    const links = this.entryPointCssFiles(name)
    const styleAttributes = this.config.style?.attributes || {}

    return links
      .map(
        (url) => `<link rel="stylesheet" href="${url}"${stringifyAttributes(styleAttributes)} />`
      )
      .join('\n')
  }

  /**
   * Register a custom asset manager driver
   */
  public extend(name: string, callback: ExtendCallback): this {
    this.drivers[name] = callback
    return this
  }
}
