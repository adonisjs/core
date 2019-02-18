/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { MultipartFileContract } from '../Contracts'

type FileData = {
  fieldName: string,
  fileName: string,
  tmpPath: string,
  bytes: number,
}

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

  constructor (private _data: FileData) {
  }

  /**
   * Returns a boolean telling if file has been
   * moved to the destination successfully
   * or not
   */
  public get moved (): boolean {
    return false
  }

  /**
   * Returns a boolean telling if file is
   * valid or not
   */
  public get isValid (): boolean {
    return false
  }

  /**
   * Current status of the file
   */
  public get status (): 'pending' | 'moved' | 'error' {
    return 'pending'
  }

  public async move () {
  }
}
