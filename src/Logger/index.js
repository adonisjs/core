'use strict'

/**
  * adonis-framework
  * Copyright(c) 2015-2015 Harminder Virk
  * MIT Licensed
*/

const log = require('npmlog')

class Logger {

  constructor(prefix, level) {
    const customLevel = this._returnCustomLevel()
    this.prefix = prefix || ''
    this.level = level || customLevel
  }

  /**
   * @description returns custom level based upon
   * command line arguments
   * @method _returnCustomLevel
   * @return {String}
   * @private
   */
  _returnCustomLevel() {
    const args = process.argv.slice(2)
    if(args.indexOf('--verbose') > -1) {
      return 'verbose'
    }
    else if(args.indexOf('--silly') > -1) {
      return 'silly'
    }
    else if(args.indexOf('--debug') > -1) {
      return 'http'
    }
    return 'info'
  }

  /**
   * @description set's npm log level
   * before calling log method
   * @method _setLevel
   * @private
   */
  _setLevel () {
    log.level = this.level
  }

  /**
   * @description calls info method on npm
   * log object
   * @method info
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  info () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.info.apply(this,args)
  }

  /**
   * @description calls verbose method on npm
   * log object
   * @method verbose
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  verbose () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.verbose.apply(this, args)
  }

  /**
   * @description calls info method on npm
   * log object
   * @method debug
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  debug () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.http.apply(this,args)
  }

  /**
   * @description calls info method on npm
   * log object
   * @method warn
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  warn () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.warn.apply(this,args)
  }

  /**
   * @description calls info method on npm
   * log object
   * @method error
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  error () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.error.apply(this,args)
  }

  /**
   * @description calls info method on npm
   * log object
   * @method silly
   * @param  {String} message
   * @param  {Mixed} extra
   * @return {void}
   * @public
   */
  silly () {
    this._setLevel()
    const args = Array.prototype.slice.call(arguments)
    args.unshift(this.prefix)
    log.silly.apply(this,args)
  }
}

module.exports = Logger
