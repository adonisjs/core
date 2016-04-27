'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Form = require('./Form')

module.exports = function (env, Route) {
  env.addGlobal('form', new Form(env, Route))
}
