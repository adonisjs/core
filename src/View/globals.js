'use strict'

/**
 * adonis-framework
 *
 * @license MIT
 * @copyright AdonisJs - Harminder Virk <virk@adonisjs.com>
 */

const Form = require('./Form')

module.exports = function (env, Route) {
  env.addGlobal('form', new Form(env, Route))

  env.addGlobal('linkTo', function (route, text, options, target) {
    const url = env.filters.route(route, options)
    target = target ? `target="${target}"` : ''
    return env.filters.safe(`<a href="${url}" ${target}> ${text} </a>`)
  })

  env.addGlobal('linkToAction', function (action, text, options, target) {
    const url = env.filters.action(action, options)
    target = target ? `target="${target}"` : ''
    return env.filters.safe(`<a href="${url}" ${target}> ${text} </a>`)
  })
}
