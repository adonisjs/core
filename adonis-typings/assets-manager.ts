/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/AssetsManager' {
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'

  /**
   * Shape of the extend callback
   */
  export type ExtendCallback = (
    manager: AssetsManagerContract,
    config: AssetsManagerConfig
  ) => AssetsDriverContract

  /**
   * Configuration for the asset manager
   */
  export type AssetsManagerConfig = {
    driver?: string
    publicPath?: string
    script?: {
      attributes: Record<string, any>
    }
    style?: {
      attributes: Record<string, any>
    }
  }

  /**
   * Shape of the driver for the assets manager. Driver driver must implement
   * it
   */
  export interface AssetsDriverContract {
    name: string

    /**
     * A boolean to know if entry points are supported or not
     */
    hasEntrypoints: boolean

    /**
     * Attributes to apply to the script tag
     */
    scriptAttributes: Record<string, any>

    /**
     * The current version of assets.
     */
    version?: string

    /**
     * Path to the public output directory. The property must be
     * mutable
     */
    publicPath: string

    /**
     * Returns the manifest contents as an object
     */
    manifest(): any

    /**
     * Returns path to a given asset entry
     */
    assetPath(filename: string): string

    /**
     * Returns the entrypoints contents as an object
     */
    entryPoints?(): any

    /**
     * Returns list for all the javascript files for a given entry point.
     * Raises exceptions when [[hasEntrypoints]] is false
     */
    entryPointJsFiles?(name: string): string[]

    /**
     * Returns list for all the css files for a given entry point.
     * Raises exceptions when [[hasEntrypoints]] is false
     */
    entryPointCssFiles?(name: string): string[]
  }

  /**
   * Assets manager exposes the API to make link and HTML fragments
   * for static assets.
   *
   * The compilation is not done by the assets manager. It must be done
   * separately
   */
  export interface AssetsManagerContract extends AssetsDriverContract {
    application: ApplicationContract

    /**
     * Returns an HTML fragment for script tags. Raises exceptions
     * when [[hasEntrypoints]] is false
     */
    entryPointScriptTags(name: string): string

    /**
     * Returns an HTML fragment for stylesheet link tags. Raises exceptions
     * when [[hasEntrypoints]] is false
     */
    entryPointStyleTags(name: string): string

    /**
     * Register a custom asset manager driver
     */
    extend(name: string, callback: ExtendCallback): this
  }

  const AssetsManager: AssetsManagerContract
  export default AssetsManager
}
