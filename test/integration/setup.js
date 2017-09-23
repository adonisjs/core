'use strict'

const { registrar, ioc } = require('@adonisjs/fold')
const { Helpers, setupResolver } = require('@adonisjs/sink')
const path = require('path')

const providers = [
  path.join(__dirname, '../../providers/AppProvider'),
  path.join(__dirname, '../../providers/ViewProvider')
]

module.exports = function () {
  process.env.ENV_SILENT = true
  ioc.bind('Adonis/Src/Helpers', function () {
    return new Helpers(path.join(__dirname, './'))
  })
  setupResolver()
  return new Promise((resolve, reject) => {
    registrar
      .providers(providers)
      .registerAndBoot()
      .then(() => {
        const Config = use('Config')
        Config.set('app.logger', {
          transport: 'console',
          console: {
            driver: 'console'
          }
        })
        resolve()
      })
      .catch(reject)
  })
}
