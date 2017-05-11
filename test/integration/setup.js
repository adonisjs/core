'use strict'

const { registrar, ioc } = require('adonis-fold')
const { Helpers, setupResolver } = require('adonis-sink')
const path = require('path')

const providers = [
  path.join(__dirname, '../../providers/AppProvider'),
  path.join(__dirname, '../../providers/ViewProvider')
]

module.exports = function () {
  ioc.bind('Adonis/Src/Helpers', function () {
    return new Helpers(path.join(__dirname, './'))
  })
  setupResolver()
  return registrar.providers(providers).registerAndBoot()
}
