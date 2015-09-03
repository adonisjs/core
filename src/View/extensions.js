'use strict'

const co = require('co')
const Ioc = require('fold').Ioc

/**
 * @module viewsYield
 * @description Here we add support for es6 generators to nunjucks views
 */
function ViewsYield () {
  this.tags = ['yield']

  /**
   * @function parse
   * @description nunjucks standard parser it looks for yield
   * tag and returns everything inside it.
   * @param  {Object} parser
   * @param  {Function} nodes
   * @param  {Object} lexer
   * @return {Object}
   */
  this.parse = function (parser, nodes, lexer) {
    var tok = parser.nextToken()
    var args = parser.parseSignature(null, true)
    parser.advanceAfterBlockEnd(tok.value)
    return new nodes.CallExtensionAsync(this, 'run', args)
  }

  /**
   * @function run
   * @description nunjucks run function, it will run this Function
   * everytime it finds an execution block with yield tag
   * @param  {Object}   context
   * @param  {Object}   injections
   * @param  {Function} callback
   * @return {void}
   */
  this.run = function (context, injections, callback) {
    var keys = Object.keys(injections)
    var index = keys[0]
    var method = injections[index]

    co(function *() {
      return yield method
    })
      .then(function (response) {
        context.ctx[index] = response
        callback()
      }).catch(function (error) {
      throw error
    })
  }
}

exports = module.exports = function (env) {
  env.addExtension('yield', new ViewsYield())
  env.addGlobal('make', Ioc.make)
  env.addGlobal('use', Ioc.use)

}
