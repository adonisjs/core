/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../../adonis-typings/index.ts" />

import * as fsExtra from 'fs-extra'
import { dirname, join, isAbsolute } from 'path'
import { cuid } from '@poppinss/utils/build/helpers'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'
import {
  Visibility,
  WriteOptions,
  LocalDriverConfig,
  LocalDriverContract,
} from '@ioc:Adonis/Core/Drive'

import { pipelinePromise, slash } from '../../utils'
import { LocalFileServer } from '../LocalFileServer'
import { CannotGenerateUrlException } from '../../Exceptions/CannotGenerateUrlException'

/**
 * Local driver interacts with the local file system
 */
export class LocalDriver implements LocalDriverContract {
  private routeName = LocalFileServer.makeRouteName(this.diskName)

  /**
   * Reference to the underlying adapter. Which is
   * fs-extra
   */
  public adapter = fsExtra

  /**
   * Name of the driver
   */
  public name: 'local' = 'local'

  constructor(
    private diskName: string,
    private config: LocalDriverConfig,
    private router: RouterContract
  ) {}

  /**
   * Make absolute path to a given location
   */
  public makePath(location: string) {
    return isAbsolute(location) ? location : join(this.config.root, location)
  }

  /**
   * Returns the file contents as a buffer. The buffer return
   * value allows you to self choose the encoding when
   * converting the buffer to a string.
   */
  public async get(location: string): Promise<Buffer> {
    return this.adapter.readFile(this.makePath(location))
  }

  /**
   * Returns the file contents as a stream
   */
  public async getStream(location: string): Promise<NodeJS.ReadableStream> {
    return this.adapter.createReadStream(this.makePath(location))
  }

  /**
   * A boolean to find if the location path exists or not
   */
  public exists(location: string): Promise<boolean> {
    return this.adapter.pathExists(this.makePath(location))
  }

  /**
   * Not supported
   */
  public async getVisibility(): Promise<Visibility> {
    return this.config.visibility
  }

  /**
   * Returns the file stats
   */
  public async getStats(location: string): Promise<{ size: number; modified: Date }> {
    const stats = await this.adapter.stat(this.makePath(location))
    return {
      modified: stats.mtime,
      size: stats.size,
    }
  }

  /**
   * Not supported
   */
  public async getSignedUrl(
    location: string,
    options?: { expiresIn?: string | number }
  ): Promise<string> {
    if (!this.config.serveAssets) {
      throw CannotGenerateUrlException.invoke(location, this.diskName)
    }

    return this.router.makeSignedUrl(
      this.routeName,
      { [LocalFileServer.filePathParamName]: [location] },
      {
        expiresIn: options?.expiresIn,
      }
    )
  }

  /**
   * Not supported
   */
  public async getUrl(location: string): Promise<string> {
    if (!this.config.serveAssets) {
      throw CannotGenerateUrlException.invoke(location, this.diskName)
    }

    return this.router.makeUrl(this.routeName, { [LocalFileServer.filePathParamName]: [location] })
  }

  /**
   * Write string|buffer contents to a destination. The missing
   * intermediate directories will be created (if required).
   */
  public async put(location: string, contents: Buffer | string): Promise<void> {
    return this.adapter.outputFile(this.makePath(location), contents)
  }

  /**
   * Put a file from the local disk or the bodyparser file to the
   * drive. The return value is always a unix path.
   */
  public async putFile(
    file: MultipartFileContract,
    destination?: string,
    options?: WriteOptions & {
      name?: string
    }
  ): Promise<string> {
    const fileName = options?.name || `${cuid()}.${file.extname}`
    const filePath = join(destination || './', fileName)
    const unixPath = slash(filePath)
    const absPath = this.makePath(filePath)

    await this.adapter.move(file.tmpPath!, absPath)
    file.markAsMoved(unixPath, absPath)
    return unixPath
  }

  /**
   * Write a stream to a destination. The missing intermediate
   * directories will be created (if required).
   */
  public async putStream(location: string, contents: NodeJS.ReadableStream): Promise<void> {
    const absolutePath = this.makePath(location)

    const dir = dirname(absolutePath)
    await this.adapter.ensureDir(dir)

    const writeStream = this.adapter.createWriteStream(absolutePath)

    /**
     * If streaming is interrupted, then the destination file will be
     * created with partial or empty contents.
     *
     * Earlier we are cleaning up the empty file, which addresses one
     * use case (no pre-existing file was there).
     *
     * However, in case there was already a file, it will be then emptied
     * out. So basically there is no way to get the original contents
     * back unless we read the existing content in buffer, but then
     * we don't know how large the file is.
     */
    await pipelinePromise(contents, writeStream)
  }

  /**
   * Not supported
   */
  public async setVisibility(): Promise<void> {
    return
  }

  /**
   * Remove a given location path
   */
  public delete(location: string): Promise<void> {
    return this.adapter.remove(this.makePath(location))
  }

  /**
   * Copy a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public copy(source: string, destination: string): Promise<void> {
    return this.adapter.copy(this.makePath(source), this.makePath(destination), { overwrite: true })
  }

  /**
   * Move a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public move(source: string, destination: string): Promise<void> {
    return this.adapter.move(this.makePath(source), this.makePath(destination), { overwrite: true })
  }
}
