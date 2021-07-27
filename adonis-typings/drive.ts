/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Drive' {
  import * as fsExtra from 'fs-extra'
  import { DirectoryJSON, vol } from 'memfs'
  import { ManagerContract } from '@poppinss/manager'
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'

  /**
   * Options for writing, moving and copying
   * files
   */
  export type WriteOptions = {
    visibility?: string
  }

  /**
   * Available visibilities
   */
  export type Visibility = 'public' | 'private'

  /**
   * Shape of the generic driver
   */
  export interface DriverContract {
    /**
     * Name of the driver
     */
    name: string

    /**
     * A boolean to find if the location path exists or not
     */
    exists(location: string): Promise<boolean>

    /**
     * Returns the file contents as a buffer. The buffer return
     * value allows you to self choose the encoding when
     * converting the buffer to a string.
     */
    get(location: string): Promise<Buffer>

    /**
     * Returns the file contents as a stream
     */
    getStream(location: string): Promise<NodeJS.ReadableStream>

    /**
     * Returns the location path visibility status
     */
    getVisibility(location: string): Promise<Visibility>

    /**
     * Returns the location path stats
     */
    getStats(location: string): Promise<{ size: number; modified: Date }>

    /**
     * Returns a signed URL for a given location path
     */
    getSignedUrl(location: string, options?: { expiresIn?: string | number }): Promise<string>

    /**
     * Returns a URL for a given location path
     */
    getUrl(location: string): Promise<string>

    /**
     * Write string|buffer contents to a destination. The missing
     * intermediate directories will be created (if required).
     */
    put(location: string, contents: Buffer | string, options?: WriteOptions): Promise<void>

    /**
     * Write a stream to a destination. The missing intermediate
     * directories will be created (if required).
     */
    putStream(
      location: string,
      contents: NodeJS.ReadableStream,
      options?: WriteOptions
    ): Promise<void>

    /**
     * Update the visibility of the file
     */
    setVisibility(location: string, visibility: Visibility): Promise<void>

    /**
     * Remove a given location path
     */
    delete(location: string): Promise<void>

    /**
     * Copy a given location path from the source to the desination.
     * The missing intermediate directories will be created (if required)
     */
    copy(source: string, destination: string, options?: WriteOptions): Promise<void>

    /**
     * Move a given location path from the source to the desination.
     * The missing intermediate directories will be created (if required)
     */
    move(source: string, destination: string, options?: WriteOptions): Promise<void>
  }

  /**
   * Config accepted by the local disk driver
   */
  export type LocalDriverConfig = {
    driver: 'local'
    visibility: Visibility
    root: string

    /**
     * Base path is always required when "serveAssets = true"
     */
    serveAssets?: boolean
    basePath?: string
  }

  /**
   * Shape of the local disk driver
   */
  export interface LocalDriverContract extends DriverContract {
    name: 'local'
    adapter: typeof fsExtra
    makePath(location: string): string
  }

  /**
   * Config accepted by the memory disk driver
   */
  export type MemoryDriverConfig = {
    driver: 'memory'
    visibility: Visibility
    root: string

    /**
     * Base path is always required when "serveAssets = true"
     */
    serveAssets?: boolean
    basePath?: string
  }

  /**
   * Shape of the memory disk driver
   */
  export interface MemoryDriverContract extends DriverContract {
    name: 'memory'
    adapter: typeof vol
    makePath(location: string): string
    toJSON(): DirectoryJSON
    clear(): void
  }

  /**
   * A default list of supported drivers
   */
  export interface DriversList {
    local: {
      implementation: LocalDriverContract
      config: LocalDriverConfig
    }
  }

  /**
   * A list of disks registered in the user land
   */
  export interface DisksList {}

  /**
   * The config accepted by Drive
   * @type {Object}
   */
  export type DriveConfig = {
    disk: keyof DisksList
    disks: { [P in keyof DisksList]: DisksList[P]['config'] }
  }

  /**
   * Drive manager to manage disk instances
   */
  export interface DriveManagerContract
    extends ManagerContract<
        ApplicationContract,
        DriverContract,
        DriverContract,
        { [P in keyof DisksList]: DisksList[P]['implementation'] }
      >,
      Omit<DriverContract, 'name'> {}

  const Drive: DriveManagerContract
  export default Drive
}
