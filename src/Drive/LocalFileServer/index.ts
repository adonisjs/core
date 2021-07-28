/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../../adonis-typings/index.ts" />

import { extname } from 'path'
import { StatsBase } from 'fs'
import { Exception } from '@poppinss/utils'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import {
  LocalDriverConfig,
  MemoryDriverConfig,
  LocalDriverContract,
  MemoryDriverContract,
} from '@ioc:Adonis/Core/Drive'

/**
 * Registers the route to serve files from the local driver
 * or the memory driver.
 */
export class LocalFileServer {
  /**
   * Makes the route name for a given disk name
   */
  public static makeRouteName(diskName: string) {
    return `drive.${diskName}.serve`
  }

  /**
   * The file path route param name
   */
  public static filePathParamName = '*'

  constructor(
    private diskName: string,
    private config: LocalDriverConfig | MemoryDriverConfig,
    private driver: LocalDriverContract | MemoryDriverContract,
    private router: RouterContract
  ) {}

  /**
   * Returns the file stats
   */
  private getFileStats(filePath: string) {
    return new Promise<StatsBase<number | bigint> | undefined>((resolve, reject) => {
      this.driver.adapter.stat(filePath, (error, stats) => {
        if (error) {
          reject(error)
        } else {
          resolve(stats)
        }
      })
    })
  }

  /**
   * Registers route for disk using "local" driver and "serveAssets"
   * true
   */
  public registerRoute() {
    /**
     * Base path must always be defined
     */
    if (!this.config.basePath) {
      throw new Exception(
        `Missing property "basePath" in "${this.diskName}" disk config`,
        500,
        'E_MISSING_LOCAL_DRIVER_BASEPATH'
      )
    }

    const routePattern = `${this.config.basePath}/${LocalFileServer.filePathParamName}`

    this.router
      .get(routePattern, async ({ response, request, logger }) => {
        const location = request.param(LocalFileServer.filePathParamName).join('/')
        const fileVisibility = await this.driver.getVisibility(location)

        /**
         * Ensure the signature is valid for private files
         */
        if (fileVisibility === 'private' && !request.hasValidSignature()) {
          response.unauthorized('Access denied')
          return
        }

        try {
          const filePath = this.driver.makePath(location)
          const stats = await this.getFileStats(filePath)

          /**
           * Ignore requests for directories
           */
          if (!stats || !stats.isFile()) {
            return response.notFound('File not found')
          }

          /**
           * Set appropriate headers
           */
          response.header('Last-Modified', stats.mtime.toUTCString())
          response.type(extname(filePath))
          response.setEtag(stats, true)

          /*
           * Do not stream files for HEAD request, but set the appropriate
           * status code.
           *
           * 200: When NOT using etags or cache is NOT fresh. This forces browser
           *      to always make a GET request
           *
           * 304: When etags are used and cache is fresh
           */
          if (request.method() === 'HEAD') {
            response.status(response.fresh() ? 304 : 200)
            return
          }

          /*
           * Regardless of request method, if cache is
           * fresh, then we must respond with 304
           */
          if (response.fresh()) {
            response.status(304)
            return
          }

          /**
           * Set content length if serving the file
           */
          response.header('Content-length', stats.size.toString())

          /**
           * Stream file.
           */
          return response.stream(await this.driver.getStream(location))
        } catch (error) {
          if (error.code === 'ENOENT') {
            response.notFound('File not found')
          } else {
            logger.fatal(
              error,
              `drive: Unable to serve file "${location}" from "${this.diskName}" disk`
            )
            response.internalServerError('Cannot process file')
          }
        }
      })
      .as(LocalFileServer.makeRouteName(this.diskName))
  }
}
