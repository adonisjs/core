/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../../adonis-typings/index.ts" />

import { Manager } from '@poppinss/manager'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { ManagerConfigValidator } from '@poppinss/utils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

import {
  DisksList,
  Visibility,
  DriveConfig,
  WriteOptions,
  DriverContract,
  LocalDriverConfig,
  DriveManagerContract,
} from '@ioc:Adonis/Core/Drive'

/**
 * Drive manager exposes the API to resolve disks and extend by
 * adding custom drivers
 */
export class DriveManager
  extends Manager<
    ApplicationContract,
    DriverContract,
    DriverContract,
    { [P in keyof DisksList]: DisksList[P]['implementation'] }
  >
  implements DriveManagerContract
{
  /**
   * Cache all disks instances
   */
  protected singleton = true

  constructor(
    public application: ApplicationContract,
    public router: RouterContract,
    private config: DriveConfig
  ) {
    super(application)
    this.validateConfig()
  }

  /**
   * Validate config
   */
  private validateConfig() {
    const validator = new ManagerConfigValidator(this.config, 'drive', 'config/drive')
    validator.validateDefault('disk')
    validator.validateList('disks', 'disk')
  }

  /**
   * Returns the default mapping name
   */
  protected getDefaultMappingName() {
    return this.config.disk
  }

  /**
   * Returns config for a given mapping
   */
  protected getMappingConfig(diskName: keyof DisksList) {
    return this.config.disks[diskName]
  }

  /**
   * Returns the name of the drive used by a given mapping
   */
  protected getMappingDriver(diskName: keyof DisksList): string | undefined {
    return this.getMappingConfig(diskName)?.driver
  }

  /**
   * Make instance of the local driver
   */
  protected createLocal(diskName: keyof DisksList, config: LocalDriverConfig) {
    const { LocalDriver } = require('../Drivers/Local')
    return new LocalDriver(diskName, config, this.router)
  }

  /**
   * Returns the file contents as a buffer. The buffer return
   * value allows you to self choose the encoding when
   * converting the buffer to a string.
   */
  public async get(location: string): Promise<Buffer> {
    return this.use().get(location)
  }

  /**
   * Returns the file contents as a stream
   */
  public async getStream(location: string): Promise<NodeJS.ReadableStream> {
    return this.use().getStream(location)
  }

  /**
   * A boolean to find if the location path exists or not
   */
  public exists(location: string): Promise<boolean> {
    return this.use().exists(location)
  }

  /**
   * Not supported
   */
  public async getVisibility(location: string): Promise<Visibility> {
    return this.use().getVisibility(location)
  }

  /**
   * Returns the file stats
   */
  public async getStats(location: string): Promise<{ size: number; modified: Date }> {
    return this.use().getStats(location)
  }

  /**
   * Not supported
   */
  public async getSignedUrl(
    location: string,
    options?: { expiresIn?: number | string }
  ): Promise<string> {
    return this.use().getSignedUrl(location, options)
  }

  /**
   * Not supported
   */
  public getUrl(location: string): Promise<string> {
    return this.use().getUrl(location)
  }

  /**
   * Write string|buffer contents to a destination. The missing
   * intermediate directories will be created (if required).
   */
  public async put(location: string, contents: Buffer | string): Promise<void> {
    return this.use().put(location, contents)
  }

  /**
   * Write string|buffer contents to a destination. The missing
   * intermediate directories will be created (if required).
   */
  public async putFile(
    source: MultipartFileContract,
    destination: string,
    options?: WriteOptions & {
      name?: string
    }
  ): Promise<string> {
    return this.use().putFile(source, destination, options)
  }

  /**
   * Write a stream to a destination. The missing intermediate
   * directories will be created (if required).
   */
  public async putStream(location: string, contents: NodeJS.ReadableStream): Promise<void> {
    return this.use().putStream(location, contents)
  }

  /**
   * Not supported
   */
  public async setVisibility(location: string, visibility: Visibility): Promise<void> {
    return this.use().setVisibility(location, visibility)
  }

  /**
   * Remove a given location path
   */
  public delete(location: string): Promise<void> {
    return this.use().delete(location)
  }

  /**
   * Copy a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public copy(source: string, destination: string): Promise<void> {
    return this.use().copy(source, destination)
  }

  /**
   * Move a given location path from the source to the desination.
   * The missing intermediate directories will be created (if required)
   */
  public move(source: string, destination: string): Promise<void> {
    return this.use().move(source, destination)
  }
}
