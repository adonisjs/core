/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createHash } from 'crypto'
import { AssetsDriverContract } from '@ioc:Adonis/Core/AssetsManager'
import { BaseDriver } from './Base'

/**
 * Resolves entry points and assets path for webpack encore. Relies
 * on the "manifest.json" and "entrypoints.json" files.
 *
 **********************************************************************
 * The driver assumes following format for the manifest.json file
 **********************************************************************
 *
 * ```json
 *  {
 *    "assetName": "assetUrl"
 *  }
 * ```
 **********************************************************************
 * The driver assumes following format for the entrypoints.json file
 ***********************************************************************
 *
 * ```json
 *  {
 *    "entrypoints": {
 *      "entrypointName": {
 *        "js": ["path1", "path2"],
 *        "css": ["path1", "path2"]
 *      }
 *    }
 *  }
 * ```
 */
export class EncoreDriver extends BaseDriver implements AssetsDriverContract {
  public name = 'encore'

  /**
   * Encore driver has support for entrypoints
   */
  public hasEntrypoints = true

  /**
   * Attributes to apply to the script tag
   */
  public scriptAttributes: Record<string, any> = {}

  /**
   * Returns the version of the assets by hashing the manifest file
   * contents
   */
  public get version() {
    return createHash('md5').update(JSON.stringify(this.manifest())).digest('hex').slice(0, 10)
  }

  /**
   * Returns path to a given asset file
   */
  public assetPath(name: string): string {
    const manifest = this.manifest()
    if (!manifest[name]) {
      throw new Error(`Cannot find path for "${name}" asset. Make sure you are compiling assets`)
    }

    return manifest[name]
  }

  /**
   * Returns list for all the javascript files for a given entry point
   */
  public entryPointJsFiles(name: string): string[] {
    const entrypoints = this.entryPoints()
    if (!entrypoints[name]) {
      throw new Error(
        `Cannot find assets for "${name}" entrypoint. Make sure you are compiling assets`
      )
    }

    return entrypoints[name].js || []
  }

  /**
   * Returns list for all the css files for a given entry point
   */
  public entryPointCssFiles(name: string): string[] {
    const entrypoints = this.entryPoints()
    if (!entrypoints[name]) {
      throw new Error(
        `Cannot find assets for "${name}" entrypoint. Make sure you are compiling assets`
      )
    }

    return entrypoints[name].css || []
  }
}
