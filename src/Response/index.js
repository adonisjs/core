'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const NodeRes = require('node-res')
const Cookies = require('../Cookies')

NodeRes.prototype._send = NodeRes.prototype.send

function Response (View, Route) {

  /**
   * @function view
   * @description extending nodeRes prototype to attach view method
   * @param  {String} template_path path to template
   * @param  {Object} data          data to pass to template
   * @return {String}               Compiled template
   * @public
   */
  NodeRes.prototype.view = function (template_path, data) {
    return new Promise(function (resolve, reject) {
      View
        .make(template_path, data)
        .then(resolve)
        .catch(reject)
    })
  }


  /**
   * @function cookie
   * @description attaches cookie to response
   * @param  {String} key
   * @param  {*} value
   * @return {Object} reference to this for chaining
   */
  NodeRes.prototype.cookie = function (key, value, options) {
    if(!this.response._cookies){
      this.response._cookies = {}
    }
    if(!key){
      throw new Error('key is required to set cookie on request')
    }
    this.response._cookies[key] = {key:key,options:options,value:value}
    return this;
  }


  /**
   * @function clearCookie
   * @description clears cookie by setting it expired
   * @param  {String} key
   * @return {Object}
   */
  NodeRes.prototype.clearCookie = function (key, options) {
    options = options || {}
    options.expires = new Date(1)
    return this.cookie(key,'',options)
  }

  /**
   * @function send
   * @description overrides actual node-res send method to
   * attach cookies while sending response
   * @param  {*} value
   * @return {Object}
   */
  NodeRes.prototype.send = function (value){
    if(this.response._cookies){
      Cookies.attachObject(this.response,this.response._cookies)
    }
    this._send(value)
    return this
  }


  /**
   * @function route
   * @description redirect to a given route
   * @param  {String} route
   * @param  {Object} data
   */
  NodeRes.prototype.route = function (route, data) {
    const toRoute = Route.url(route, data)
    this.redirect(toRoute)
  }

  return NodeRes

}

module.exports = Response
