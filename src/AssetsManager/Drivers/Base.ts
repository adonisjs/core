import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { readFileSync, pathExistsSync } from 'fs-extra'
import { join } from 'path'

export abstract class BaseDriver {
  /**
   * We cache the manifest contents and the entrypoints contents
   * in production
   */
  private manifestCache?: any
  private entrypointsCache?: any

  /**
   * Path to the output public dir. Defaults to `/public/assets`
   */
  public publicPath: string = this.application.publicPath('assets')

  constructor(protected application: ApplicationContract) {}

  /**
   * Reads the file contents as JSON
   */
  protected readFileAsJSON(filePath: string) {
    if (!pathExistsSync(filePath)) {
      throw new Error(`Cannot find "${filePath}" file. Make sure you are compiling assets`)
    }

    return JSON.parse(readFileSync(filePath, 'utf-8'))
  }

  /**
   * Returns the manifest contents as object
   */
  public manifest() {
    /**
     * Use in-memory cache when exists
     */
    if (this.manifestCache) {
      this.application.logger.trace('reading manifest from cache')
      return this.manifestCache
    }

    const manifest = this.readFileAsJSON(join(this.publicPath, 'manifest.json'))
    this.application.logger.trace('reading manifest from %s', this.publicPath)

    /**
     * Cache manifest in production to avoid re-reading the file from disk
     */
    if (this.application.inProduction) {
      this.manifestCache = manifest
    }

    return manifest
  }

  /**
   * Returns the entrypoints contents as object
   */
  public entryPoints() {
    /**
     * Use in-memory cache when exists
     */
    if (this.entrypointsCache) {
      this.application.logger.trace('reading entrypoints from cache')
      return this.entrypointsCache
    }

    const entryPoints = this.readFileAsJSON(join(this.publicPath, 'entrypoints.json'))
    this.application.logger.trace('reading entrypoints from %s', this.publicPath)

    /**
     * Cache entrypoints file in production to avoid re-reading the file from disk
     */
    if (this.application.inProduction) {
      this.entrypointsCache = entryPoints.entrypoints || {}
    }

    return entryPoints.entrypoints || {}
  }
}
