/**
 * @module Core
 */

/**
 * @adonisjs/framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
*/

import _ from 'lodash'
import Resetable from 'resetable'
import { resolver } from '@adonisjs/fold'
import GE from '@adonisjs/generic-exceptions'
import { EventEmitter2 as EventEmitter, Listener } from 'eventemitter2'
import { Config } from '../Config'

const proxyHandler = {
  get (target, name) {
    /**
     * if node is inspecting then stick to target properties
     */
    if (typeof (name) === 'symbol' || name === 'inspect') {
      return target[name]
    }

    /**
     * If a faker object exists, give preference to it over
     * the actual methods
     */
    if (target._fake && target._fake[name] !== undefined) {
      return typeof (target._fake[name]) === 'function' ? target._fake[name].bind(target._fake) : target._fake[name]
    }

    return target[name]
  }
}

/**
 * Event class is used to fire events and bind
 * listeners for them.
 */
class Event {
  public emitter: EventEmitter

  private _fake = null

  private _namespacedListeners: Object = {}

  private _many = new Resetable(null)

  /**
   * Constructor.
   *
   * @param  Config  Configuration instance
   */
  constructor (Config: Config) {
    this.emitter = new EventEmitter(Config.merge('app.events', {
      wildcard: true,
      delimiter: '::',
      newListener: false,
    }))

    return new Proxy(this, proxyHandler)
  }

  /**
   * Resolves a listener via IoC Container
   *
   * @param  listener Listener to resolve
   */
  private _resolveListener (listener: Function | string): Listener {
    const { method } = resolver.forDir('listeners').resolveFunc(listener)
    if (typeof (listener) === 'string') {
      this._namespacedListeners[listener] = method
    }
    return method
  }

  /**
   * Normalizes the listener.
   *
   * @param  listener  Listener to normalize
   */
  private _normalizeListener (listener: Function | string): Listener {
    return (typeof listener === 'string')
      ? this._namespacedListeners[listener]
      : listener
  }

  /**
   * Returns a list of listeners registered
   * for an event.
   *
   * @param  event  Event from where listeners are retrieved
   *
   * @example
   * ```js
   * Event.getListeners('http::start')
   * ```
   */
  public getListeners (event: string): Function[] {
    return this.emitter.listeners(event)
  }

  /**
   * Returns a boolean indicating whether an
   * event has listeners or not
   *
   * @param  event  Event from where listeners are checked
   *
   * @example
   * ```js
   * Event.hasListeners('http::start')
   * ```
   */
  public hasListeners (event: string): boolean {
    return this.listenersCount(event) > 0
  }

  /**
   * Returns an array of listeners binded for any
   * event.
   *
   * @example
   * ```js
   * Event.getListenersAny()
   * ```
   */
  public getListenersAny (): Function[] {
    return this.emitter.listenersAny()
  }

  /**
   * Returns a count of total listeners registered
   * for an event.
   *
   * @param  event  Event from where listeners are counted
   *
   * @example
   * ```js
   * Event.listenersCount('http::start')
   * ```
   */
  public listenersCount (event: string): number {
    return this.getListeners(event).length
  }

  /**
   * Bind a listener for an event
   *
   * @param  event      Event to bind listener on
   * @param  listeners  Listener(s) to bind to the event
   *
   * @example
   * ```js
   * Event.on('http::start', function () {
   * })
   * ```
   */
  public on (event: string, listeners: Function | string | (Function | string)[]): void {
    const times = this._many.pull()

    _.each(_.castArray(listeners), (listener) => {
      if (times > 0) {
        this.emitter.many(event, times, this._resolveListener(listener))
      } else {
        this.emitter.on(event, this._resolveListener(listener))
      }
    })
  }

  /**
   * Bind a listener for an event.
   *
   * @param  event      Event to bind listener on
   * @param  listeners  Listener(s) to bind to the event
   *
   * @example
   * ```js
   * // Closure
   * Event.when('http::start', () => {
   * })
   *
   * // IoC container binding
   * Event.when('http::start', 'Http.onStart')
   *
   * // Multiple listeners
   * Event.when('http::start', ['Http.onStart', 'Http.registerViewGlobals'])
   * ```
   */
  public when (event: string, listeners: Function | string | (Function | string)[]): void {
    this.on(event, listeners)
  }

  /**
   * Emits an event.
   *
   * @param  event  Event to emit
   * @param  args   Arguments of the event
   */
  public emit (event: string, ...args: any[]): void {
    this.emitter.emit(event, ...args)
  }

  /**
   * Emits an event.
   *
   * @param  event  Event to emit
   * @param  args   Arguments of the event
   */
  public fire (event: string, ...args: any[]) {
    this.emit(event, ...args)
  }

  /**
   * Bind a listener only for a defined number of times.
   *
   * @param  number  Number of time you want the listener to run.
   *
   * @example
   * ```js
   * Event
   *   .times(3)
   *   .when('user::registers', () => {
   *   })
   * ```
   */
  public times (number: number): this {
    if (typeof (number) !== 'number') {
      throw GE.InvalidArgumentException.invalidParameter('Event.times expects a valid number', number)
    }
    this._many.set(number)
    return this
  }

  /**
   * Bind listener for any event.
   *
   * @param  listeners  Listener(s) to bind to any event
   *
   * @example
   * ```js
   * Event.onAny(function (event, data) {
   * })
   * ```
   */
  public onAny (listeners: Function | string | (Function | string)[]): void {
    _.each(_.castArray(listeners), (listener) => {
      this.emitter.onAny(this._resolveListener(listener))
    })
  }

  /**
   * Bind listener for any event.
   *
   * @param  listeners  Listener(s) to bind to any event
   *
   * @example
   * ```js
   * Event.any(function (event, data) {
   * })
   * ```
   */
  public any (listeners: Function | string | (Function | string)[]): void {
    this.onAny(listeners)
  }

  /**
   * Bind a listener only for one time.
   *
   * @param  event      Event to bind listener
   * @param  listeners  Listener(s) to bind to the event
   *
   * @example
   * ```js
   * Event.once('user::registerred', function (user) {
   * })
   * ```
   */
  public once (event: string, listeners: Function | string | (Function | string)[]): void {
    _.each(_.castArray(listeners), (listener) => {
      this.emitter.once(event, this._resolveListener(listener))
    })
  }

  /**
   * Remove listener for a given event.
   *
   * @param  event      Event to unbind listener
   * @param  listeners  Listener(s) to unbind to the event
   *
   * @example
   * ```js
   * Event.off('user::registerred', 'User.registered')
   *
   * // remove multiple listeners
   * Event.off('user::registerred', ['User.registered', 'Send.email'])
   * ```
   */
  public off (event: string, listeners: Function | string | (Function | string)[]): void {
    this.removeListener(event, listeners)
  }

  /**
   * Removes listeners binded for any event.
   *
   * @param  listeners  Listener(s) to unbind to the event
   *
   * @example
   * ```js
   * Event.offAny('Http.onStart')
   * ```
   */
  public offAny (listeners: Function | string | (Function | string)[]): void {
    _.each(_.castArray(listeners), (listener) => {
      this.emitter.offAny(this._normalizeListener(listener))
    })
  }

  /**
   * Removes listener for a given event
   *
   * @param  event      Event to unbind listener
   * @param  listeners  Listener(s) to unbind to the event
   */
  public removeListener (event: string, listeners: Function | string | (Function | string)[]): void {
    _.each(_.castArray(listeners), (listener) => {
      this.emitter.off(event, this._normalizeListener(listener))
    })
  }

  /**
   * Removes all listeners for a given event.
   *
   * @param  event  Event to unbind listeners
   *
   * @example
   * ```js
   * Event.remvoeAllListeners('http::start')
   * ```
   */
  public removeAllListeners (event: string): void {
    this.emitter.removeAllListeners(event)
  }

  /**
   * Update max listeners size which is set to 10
   * by default.
   *
   * @param  number  Number of maximum listener
   *
   * @example
   * ```js
   * Event.setMaxListeners(20)
   * ```
   */
  public setMaxListeners (number: number) {
    if (typeof (number) !== 'number') {
      throw GE.InvalidArgumentException.invalidParameter('Event.setMaxListeners expects a valid number', number)
    }
    this.emitter.setMaxListeners(number)
  }

  /**
   * Instantiate faker object, to stop emitting
   * real events.
   */
  public fake (): void {
    this._fake = new (require('./Fake'))()
  }


  /**
   * Restore faker object.
   */
  public restore (): void {
    this._fake = null
  }
}

export { Event }
