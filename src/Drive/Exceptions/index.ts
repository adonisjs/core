/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

/**
 * Unable to write file to the destination
 */
export class CannotWriteFileException extends Exception {
  public location: string
  public original: any

  public static invoke(location: string, original: any) {
    const error = new this(
      `Cannot write file at location "${location}"`,
      500,
      'E_CANNOT_WRITE_FILE'
    )

    error.location = location
    error.original = original

    return error
  }
}

/**
 * Unable to read file from a given location
 */
export class CannotReadFileException extends Exception {
  public location: string
  public original: any

  public static invoke(location: string, original: any) {
    const error = new this(
      `Cannot read file from location "${location}"`,
      500,
      'E_CANNOT_READ_FILE'
    )

    error.location = location
    error.original = original

    return error
  }
}

/**
 * Unable to delete file from a given location
 */
export class CannotDeleteFileException extends Exception {
  public location: string
  public original: any

  public static invoke(location: string, original: any) {
    const error = new this(
      `Cannot delete file at location "${location}"`,
      500,
      'E_CANNOT_DELETE_FILE'
    )

    error.location = location
    error.original = original

    return error
  }
}

/**
 * Unable to copy file from source to destination
 */
export class CannotCopyFileException extends Exception {
  public source: string
  public destination: string
  public original: any

  public static invoke(source: string, destination: string, original: any) {
    const error = new this(
      `Cannot copy file from "${source}" to "${destination}"`,
      500,
      'E_CANNOT_COPY_FILE'
    )

    error.source = source
    error.destination = destination
    error.original = original

    return error
  }
}

/**
 * Unable to move file from source to destination
 */
export class CannotMoveFileException extends Exception {
  public source: string
  public destination: string
  public original: any

  public static invoke(source: string, destination: string, original: any) {
    const error = new this(
      `Cannot move file from "${source}" to "${destination}"`,
      500,
      'E_CANNOT_MOVE_FILE'
    )

    error.source = source
    error.destination = destination
    error.original = original

    return error
  }
}

/**
 * Unable to get file metadata
 */
export class CannotGetMetaDataException extends Exception {
  public location: string
  public operation: string
  public original: any

  public static invoke(location: string, operation: string, original: any) {
    const error = new this(
      `Unable to retrieve the "${operation}" for file at location "${location}"`,
      500,
      'E_CANNOT_GET_METADATA'
    )

    error.location = location
    error.operation = operation
    error.original = original

    return error
  }
}

/**
 * Unable to generate url for a file. The assets serving is disabled
 */
export class CannotGenerateUrlException extends Exception {
  public location: string

  public static invoke(location: string, diskName: string) {
    const error = new this(
      `Cannot generate URL for location "${location}". Make sure to set "serveAssets = true" for "${diskName}" disk`,
      500,
      'E_CANNOT_GENERATE_URL'
    )

    error.location = location
    return error
  }
}
