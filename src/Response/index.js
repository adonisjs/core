'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const NodeRes = require('node-res')
const Cookies = require('../Cookies')

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
   * attaches cookie to response
   * @param  {String} key
   * @param  {*} value
   * @return {Object} reference to this for chaining
   */
  NodeRes.prototype.cookie = function (key,value) {
    if((key && !value && typeof(key) !== 'object') || (!key && !value)){
      throw new Error('Pass key , value pair or an object to attach cookies to response')
    }
    if(key && !value){
      Cookies.attachObject(this.response,key);
    }else{
      Cookies.attach(this.response,key,value)
    }
    return this;
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
