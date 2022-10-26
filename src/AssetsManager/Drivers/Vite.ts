import { AssetsDriverContract } from '@ioc:Adonis/Core/AssetsManager'
import { join } from 'path'
import { BaseDriver } from './Base'

/**
 * Resolves entry points and assets path for Vite. Relies
 * on the "manifest.json" and "entrypoints.json" files.
 *
 **********************************************************************
 * The driver assumes following format for the manifest.json file
 **********************************************************************
 *
 * ```json
 *  {
 *    "assetName": {
 *      "file": "path",
 *      "src": "path"
 *    },
 *    ...
 *  }
 * ```
 **********************************************************************
 * The driver assumes following format for the entrypoints.json file
 ***********************************************************************
 *
 * ```json
 *  {
 *    "url": "url"
 *    "entrypoints": {
 *      "__entrypoint_name_idx__": "path",
 *      "__entrypoint_name_idx__": "path"
 *    }
 *  }
 * ```
 *
 * Please read the documentation for understanding the format of the files.
 */
export class ViteDriver extends BaseDriver implements AssetsDriverContract {
  public name = 'vite'

  /**
   * Vite driver has support for entrypoints
   */
  public hasEntrypoints = true

  /**
   * Attributes to apply to the script tag. Vite needs to serve
   * source over native ESM
   */
  public scriptAttributes: Record<string, any> = { type: 'module' }

  /**
   * If we should use the manifest. We only use the manifest in production.
   */
  private shouldUseManifest() {
    return this.application.inProduction
  }

  /**
   * Get the dev server url from the entrypoints.json file
   */
  private getDevServerUrl() {
    return this.readFileAsJSON(join(this.publicPath, 'entrypoints.json')).url
  }

  /**
   * Get all the files for a given entry point
   *
   * Vite doesn't have a concept of multiples files for a given entrypoint.
   * That's why the entries are formatted like this. Read vite plugin
   * documentation for more details.
   */
  private getEntryPointGroup(name: string) {
    const entrypoints = this.entryPoints()

    const regex = new RegExp(`^__entrypoint_${name}_\\d+__$`)
    const entrypointKeys = Object.keys(entrypoints).filter((key) => regex.test(key))

    return entrypointKeys.map((key) => entrypoints[key])
  }

  /**
   * Returns path to a given asset file
   */
  public assetPath(filename: string): string {
    if (!this.shouldUseManifest()) {
      return `${this.getDevServerUrl()}/${filename}`
    }

    const manifest = this.manifest()
    if (!manifest[filename]) {
      throw new Error(`Cannot find "${filename}" asset in the manifest file`)
    }

    return manifest[filename].file
  }

  /**
   * Returns the manifest contents as object
   *
   * Note that the manifest file is only available in production.
   * Vite doesn't generate any manifest file in development.
   */
  public override manifest() {
    if (!this.shouldUseManifest()) {
      throw new Error('Cannot use manifest in development')
    }

    return super.manifest()
  }

  /**
   * Returns list for all the javascript files for a given entry point
   */
  public entryPointJsFiles(name: string): string[] {
    const entrypoints = this.getEntryPointGroup(name)

    if (!entrypoints) {
      throw new Error(
        `Cannot find assets for "${name}" entrypoint. Make sure to define it inside the "entryPoints" vite config`
      )
    }

    return entrypoints.filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
  }

  /**
   * Returns list for all the css files for a given entry point
   */
  public entryPointCssFiles(name: string): string[] {
    const entrypoints = this.getEntryPointGroup(name)

    if (!entrypoints) {
      throw new Error(
        `Cannot find assets for "${name}" entrypoint. Make sure to define it inside the "entryPoints" vite config`
      )
    }

    return entrypoints.filter((entrypoint: string) => entrypoint.endsWith('.css'))
  }

  /**
   * Returns the script needed for the HMR working with React
   */
  public getReactHmrScript(): string {
    if (!this.application.inDev) {
      return ''
    }

    return `
    <script type="module">
      import RefreshRuntime from '${this.getDevServerUrl()}/@react-refresh'
      RefreshRuntime.injectIntoGlobalHook(window)
      window.$RefreshReg$ = () => {}
      window.$RefreshSig$ = () => (type) => type
      window.__vite_plugin_react_preamble_installed__ = true
    </script>
    `
  }

  /**
   * Returns the script needed for the HMR working with Vite
   */
  public getViteHmrScript(): string {
    if (!this.application.inDev) {
      return ''
    }

    return `<script type="module" src="${this.getDevServerUrl()}/@vite/client"></script>`
  }
}
