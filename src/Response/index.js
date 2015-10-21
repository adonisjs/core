'use strict'

/**
 * adonis-framework
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

const nodeRes = require('node-res')
let viewInstance = null

class Response {

  constructor (request, response) {
    this.request = request
    this.response = response
  }

  header (key, value) {
    nodeRes.header(this.response, key, value)
    return this
  }

  * view (template, options) {
    return viewInstance.make(template, options)
  }

  removeHeader (key) {
    nodeRes.removeHeader(this.response, key)
    return this
  }

  status (statusCode) {
    nodeRes.status(this.response, statusCode)
    return this
  }

  send (body) {
    nodeRes.send(this.response, body)
  }

  json (body) {
    nodeRes.json(this.response, body)
  }

  jsonp (body) {
    const callback = this.request.input('callback')
    nodeRes.jsonp(this.response, body, callback)
  }

  download (filePath) {
    nodeRes.download(this.response, filePath)
  }

  attachment (filePath, name, disposition) {
    nodeRes.attachment(this.response, filePath, name, disposition)
  }

  location (toUrl) {
    nodeRes.location(this.response, toUrl)
    return this
  }

  redirect (toUrl, status) {
    nodeRes.redirect(this.response, toUrl, status)
  }

  vary (field) {
    nodeRes.vary(this.response, field)
    return this
  }
}

class ResponseBuilder {
  constructor (View) {
    viewInstance = View
    return Response
  }
}


module.exports =  ResponseBuilder
