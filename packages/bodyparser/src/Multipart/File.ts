/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Readable } from 'stream'

/**
 * BodyParser file represents an incoming request stream with some convivent
 * methods
 */
export class File {
  public streamEnded = false

  private _onEnd = function onClose () {
    this.streamEnded = true
    this.stream.removeListener('close', this._onEnd)
  }.bind(this)

  constructor (public stream: Readable) {
    this.stream.on('end', this._onEnd)
  }
}
