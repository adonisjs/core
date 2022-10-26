/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { AssetsDriverContract } from '@ioc:Adonis/Core/AssetsManager'

/**
 * Fake driver stubs out the implementation of the Assets
 * manager with empty return data.
 *
 * The main use case is to make assets manager work during
 * testing without compiling the real assets
 */
export class FakeDriver implements AssetsDriverContract {
  public name = 'fake'
  public hasEntrypoints = true
  public publicPath = this.application.publicPath('assets')
  public scriptAttributes: Record<string, any> = {}
  public get version() {
    return ''
  }

  constructor(private application: ApplicationContract) {}

  /**
   * Returns the manifest contents as object
   */
  public manifest() {
    return {}
  }

  /**
   * Returns path to a given asset file
   */
  public assetPath(name: string): string {
    return `__fake('${name}')`
  }

  /**
   * Returns the entrypoints contents as object
   */
  public entryPoints() {
    return {}
  }

  /**
   * Returns list for all the javascript files for a given entry point
   */
  public entryPointJsFiles(_: string): string[] {
    return []
  }

  /**
   * Returns list for all the css files for a given entry point
   */
  public entryPointCssFiles(_: string): string[] {
    return []
  }
}
