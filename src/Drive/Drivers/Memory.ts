/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../../adonis-typings/index.ts" />

import { Volume } from 'memfs'
import { createReadStream } from 'fs'
import { slash } from '@poppinss/utils'
import { dirname, join, isAbsolute } from 'path'
import { cuid } from '@poppinss/utils/build/helpers'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

import {
  Visibility,
  WriteOptions,
  ContentHeaders,
  MemoryDriverConfig,
  MemoryDriverContract,
} from '@ioc:Adonis/Core/Drive'

import { pipelinePromise } from '../../utils'
import { LocalFileServer } from '../LocalFileServer'

import {
  CannotCopyFileException,
  CannotMoveFileException,
  CannotReadFileException,
  CannotWriteFileException,
  CannotGenerateUrlException,
  CannotDeleteFileException,
  CannotGetMetaDataException,
} from '../Exceptions'

/**
 * Memory driver is mainly used for testing
 */
export class MemoryDriver implements MemoryDriverContract {
  private routeName = LocalFileServer.makeRouteName(this.diskName)

  /**
   * Reference to the underlying adapter. Which is memfs
   */
  public adapter = new Volume()

  /**
   * Name of the driver
   */
  public name: 'memory' = 'memory'

  constructor(
    private diskName: string,
    private config: MemoryDriverConfig,
    private router: RouterContract
  ) {}

  /**
   * Make absolute path to a given location
   */
  public makePath(location: string) {
    return isAbsolute(location) ? location : join(this.config.root, location)
  }

  /**
   * Creates the directory recursively with in the memory
   */
  private ensureDir(location: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.adapter.mkdirp(dirname(location), (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Returns the file contents as a buffer. The buffer return
   * value allows you to self choose the encoding when
   * converting the buffer to a string.
   */
  public async get(location: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.adapter.readFile(this.makePath(location), (error, data: Buffer) => {
        if (error) {
          reject(CannotReadFileException.invoke(location, error))
        } else {
          resolve(data)
        }
      })
    })
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
    return new Promise((resolve) => {
      this.adapter.exists(this.makePath(location), (exists) => {
        resolve(exists)
      })
    })
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
    return new Promise((resolve, reject) => {
      this.adapter.stat(this.makePath(location), (error, stats) => {
        if (error) {
          reject(CannotGetMetaDataException.invoke(location, 'stats', error))
        } else {
          resolve({
            modified: stats!.mtime,
            size: stats!.size as number,
          })
        }
      })
    })
  }

  /**
   * Not supported
   */
  public async getSignedUrl(
    location: string,
    options?: ContentHeaders & { expiresIn?: string | number }
  ): Promise<string> {
    if (!this.config.serveAssets) {
      throw CannotGenerateUrlException.invoke(location, this.diskName)
    }

    const { expiresIn, ...qs } = options || {}
    return this.router.makeSignedUrl(
      this.routeName,
      { [LocalFileServer.filePathParamName]: [location] },
      {
        expiresIn,
        qs,
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
    const absolutePath = this.makePath(location)
    await this.ensureDir(absolutePath)

    return new Promise((resolve, reject) => {
      this.adapter.writeFile(absolutePath, contents, (error) => {
        if (error) {
          reject(CannotWriteFileException.invoke(location, error))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Put a file from the local disk or the bodyparser file to the
   * drive
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

    await this.putStream(absPath, createReadStream(file.tmpPath!))
    file.markAsMoved(unixPath, absPath)
    return unixPath
  }

  /**
   * Write a stream to a destination. The missing intermediate
   * directories will be created (if required).
   */
  public async putStream(location: string, contents: NodeJS.ReadableStream): Promise<void> {
    const absolutePath = this.makePath(location)
    try {
      await this.ensureDir(absolutePath)

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
    } catch (error) {
      throw CannotWriteFileException.invoke(location, error)
    }
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
  public async delete(location: string): Promise<void> {
    if (!(await this.exists(location))) {
      return
    }

    return new Promise((resolve, reject) => {
      this.adapter.unlink(this.makePath(location), (error) => {
        if (error) {
          reject(CannotDeleteFileException.invoke(location, error))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Copy a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public async copy(source: string, destination: string): Promise<void> {
    const desintationAbsolutePath = this.makePath(destination)
    await this.ensureDir(desintationAbsolutePath)

    return new Promise((resolve, reject) => {
      this.adapter.copyFile(this.makePath(source), desintationAbsolutePath, (error) => {
        if (error) {
          reject(CannotCopyFileException.invoke(source, destination, error))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Move a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public async move(source: string, destination: string): Promise<void> {
    const sourceAbsolutePath = this.makePath(source)
    const desintationAbsolutePath = this.makePath(destination)
    await this.ensureDir(desintationAbsolutePath)

    return new Promise<void>((resolve, reject) => {
      this.adapter.copyFile(sourceAbsolutePath, desintationAbsolutePath, (error) => {
        if (error) {
          reject(CannotMoveFileException.invoke(source, destination, error))
        } else {
          resolve()
        }
      })
    }).then(() => this.delete(sourceAbsolutePath))
  }

  /**
   * Returns files as JSON
   */
  public toJSON() {
    return this.adapter.toJSON()
  }

  /**
   * Clear files within memory
   */
  public clear() {
    return this.adapter.reset()
  }
}
