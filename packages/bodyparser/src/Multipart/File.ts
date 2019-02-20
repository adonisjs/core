/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { extname } from 'path'
import * as bytes from 'bytes'
import * as mediaTyper from 'media-typer'
import { MultipartFileContract, FileValidationOptions, FileUploadError, FileInputNode } from '../Contracts'

/**
 * File class exposes a friendly API to validate or save uploaded
 * files.
 */
export class File implements MultipartFileContract {
  /**
   * Field name is the name of the field
   */
  public fieldName = this._data.fieldName

  /**
   * Client name is the file name on the user client
   */
  public clientName = this._data.fileName

  /**
   * File size in bytes
   */
  public size = this._data.bytes

  /**
   * Path to the tmp folder
   */
  public tmpPath = this._data.tmpPath

  /**
   * The extname for the file
   */
  public extname = extname(this.clientName).replace(/^\./, '')

  /**
   * Upload errors
   */
  public errors: FileUploadError[] = []

  /**
   * Type and subtype are extracted from the `content-type`
   * header
   */
  public type
  public subtype

  /**
   * Filename is only set after the move operation
   */
  public fileName

  /**
   * Validation options for the file
   */
  private _validationOptions: Partial<FileValidationOptions> = {}

  constructor (private _data: FileInputNode) {
    this._parseContentType()
  }

  /**
   * Parses the content type header to extract the type
   * and subtype
   */
  private _parseContentType () {
    try {
      const parsed = mediaTyper.parse(this._data.headers['content-type'])
      this.type = parsed.type
      this.subtype = parsed.subtype
    } catch (error) {
    }
  }

  /**
   * Validates the file size and updates the errors array
   */
  private _validateSize () {
    let expectedBytes = this._validationOptions.size
    if (expectedBytes === undefined) {
      return
    }

    expectedBytes = typeof (expectedBytes) === 'string' ? bytes(expectedBytes) : expectedBytes

    if (this.size > expectedBytes!) {
      this.errors.push({
        fieldName: this.fieldName,
        clientName: this.clientName,
        message: `File size should be less than ${bytes(this.size)}`,
        type: 'size',
      })
    }
  }

  /**
   * Validates file extension and updates the errors array
   */
  private _validateExtName () {
    const extnames = this._validationOptions.extnames
    if (extnames === undefined || !Array.isArray(extnames) || extnames.length === 0) {
      return
    }

    if (extnames.indexOf(this.extname) === -1) {
      const verb = extnames.length === 1 ? 'is' : 'are'
      const message = `Invalid file extension ${this.extname}. Only ${extnames.join(', ')} ${verb} allowed`

      this.errors.push({
        fieldName: this.fieldName,
        clientName: this.clientName,
        message: message,
        type: 'extname',
      })
    }
  }

  /**
   * Returns a boolean telling if file is
   * valid or not
   */
  public get isValid (): boolean {
    return this.errors.length === 0
  }

  /**
   * Current status of the file
   */
  public get status (): 'pending' | 'moved' | 'error' {
    return this.errors.length ? 'error' : (this.fileName ? 'moved' : 'pending')
  }

  /**
   * Set validation options to be used for
   * validating the file
   */
  public setValidationOptions (options: Partial<FileValidationOptions>): this {
    this._validationOptions = options

    /**
     * Reset errors, maybe errors are not relevant after the
     * new options
     */
    this.errors = []

    /**
     * Re-run validations
     */
    this._validateSize()
    this._validateExtName()

    return this
  }
}
