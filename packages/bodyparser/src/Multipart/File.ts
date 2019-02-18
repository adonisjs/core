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
  public fieldName = this._data.fieldName
  public clientName = this._data.fileName
  public size = this._data.bytes
  public tmpPath = this._data.tmpPath

  constructor (private _data: FileData) {
  }

  public get moved (): boolean {
    return false
  }

  public get isValid (): boolean {
    return false
  }

  public get status (): 'pending' | 'consumed' | 'moved' | 'error' {
    return 'pending'
  }

  public async move () {
  }
}
