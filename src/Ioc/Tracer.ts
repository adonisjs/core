/**
 * @module main
 */

/*
* @adonisjs/fold
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as Emitter from 'events'

export class Tracer extends Emitter {
  private _namespaces: string[] = []

  public in (namespace, cached) {
    const parent = this._namespaces[this._namespaces.length - 1]
    this.emit('use', { namespace, cached, parent })
    this._namespaces.push(namespace)
  }

  public out () {
    this._namespaces.pop()
  }
}

class NoopTracer {
  public in () {}
  public out () {}
  public emit () {}
  public on () {}
  public once () {}
  public removeListener () {}
  public removeListeners () {}
}

export default function tracer (enabled) {
  return enabled ? new Tracer() : (new NoopTracer() as unknown) as Tracer
}
