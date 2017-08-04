'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

module.exports = function (BaseTag) {
  return class LoggedInTag extends BaseTag {
    /**
     * The tag name
     *
     * @method tagName
     *
     * @return {String}
     */
    get tagName () {
      return 'loggedIn'
    }

    /**
     * Tag is not a block tag
     *
     * @method isBlock
     *
     * @return {Boolean}
     */
    get isBlock () {
      return true
    }

    /**
     * Compile method to create a if block to compile
     * content when a user is logged in
     *
     * @method compile
     *
     * @param  {Object} compiler
     * @param  {Object} lexer
     * @param  {Object} buffer
     * @param  {String} options.body
     * @param  {Array} options.childs
     * @param  {Number} options.lineno
     *
     * @return {void}
     */
    compile (compiler, lexer, buffer, { body, childs, lineno }) {
      const compiledStatement = this._compileStatement(lexer, 'auth.user', lineno).toStatement()

      /**
       * Open if tag
       */
      buffer.writeLine(`if (${compiledStatement}) {`)
      buffer.indent()

      /**
       * Re-parse all childs via compiler.
       */
      childs.forEach((child) => compiler.parseLine(child))

      /**
       * Close the if tag
       */
      buffer.dedent()
      buffer.writeLine('}')
    }

    /**
     * Nothing needs to be done at runtime
     *
     * @method run
     */
    run () {}
  }
}
