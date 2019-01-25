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

import { IocContract } from '../Contracts'

/**
 * Checks for the existence of fake on the target
 */
function hasFake (target) {
  return target.container.hasFake(target.binding)
}

/**
 * Calls the trap on the target
 */
function callTrap (target, trap, ...args) {
  if (hasFake(target)) {
    return Reflect[trap](target.container.useFake(target.binding), ...args)
  } else {
    return Reflect[trap](target.actual, ...args)
  }
}

/**
 * Proxy handler to handle objects
 */
const objectHandler = {
  get (target, ...args) {
    return callTrap(target, 'get', ...args)
  },

  defineProperty (target, ...args) {
    return callTrap(target, 'defineProperty', ...args)
  },

  deleteProperty (target, ...args) {
    return callTrap(target, 'deleteProperty', ...args)
  },

  getOwnPropertyDescriptor (target, ...args) {
    return callTrap(target, 'getOwnPropertyDescriptor', ...args)
  },

  getPrototypeOf (target, ...args) {
    return callTrap(target, 'getPrototypeOf', ...args)
  },

  has (target, ...args) {
    return callTrap(target, 'has', ...args)
  },

  isExtensible (target, ...args) {
    return callTrap(target, 'isExtensible', ...args)
  },

  ownKeys (target, ...args) {
    return callTrap(target, 'ownKeys', ...args)
  },

  preventExtensions () {
    throw new Error('Cannot prevent extensions during a fake')
  },

  set (target, ...args) {
    return callTrap(target, 'set', ...args)
  },

  setPrototypeOf (target, ...args) {
    return callTrap(target, 'setPrototypeOf', ...args)
  },
}

/**
 * Proxy handler to handle classes and functions
 */
const classHandler = {
  construct (target, ...args) {
    return callTrap(target, 'construct', args)
  },
}

/**
 * Proxies the objects to fallback to fake, when it exists.
 */
export class IoCProxyObject {
  constructor (public binding: string, public actual: any, public container: IocContract) {
    return new Proxy(this, objectHandler)
  }
}

/**
 * Proxies the class constructor to fallback to fake, when it exists.
 */
export function IocProxyClass (binding: string, actual: any, container: IocContract) {
  function Wrapped () {}
  Wrapped.binding = binding
  Wrapped.actual = actual
  Wrapped.container = container

  return new Proxy(Wrapped, classHandler)
}
