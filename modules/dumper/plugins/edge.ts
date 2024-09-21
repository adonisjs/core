/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type Edge, Template } from 'edge.js'
import { type Dumper } from '../dumper.js'

/**
 * Returns an edge plugin that integrates with a given
 * dumper instance
 */
export function pluginEdgeDumper(dumper: Dumper) {
  Template.macro('dumper' as any, dumper)

  return (edge: Edge) => {
    edge.registerTag({
      tagName: 'dump',
      block: false,
      seekable: true,
      noNewLine: true,
      compile(parser, buffer, token) {
        const parsed = parser.utils.transformAst(
          parser.utils.generateAST(token.properties.jsArg, token.loc, token.filename),
          token.filename,
          parser
        )

        buffer.writeExpression(
          `template.stacks.pushOnceTo('dumper', 'dumper_globals', template.dumper.getHeadElements(state.cspNonce))`,
          token.filename,
          token.loc.start.line
        )

        buffer.outputExpression(
          `template.dumper.dumpToHtml(${parser.utils.stringify(parsed)}, { cspNonce: state.cspNonce, source: { location: $filename, line: $lineNumber } })`,
          token.filename,
          token.loc.start.line,
          true
        )
      },
    })

    edge.registerTag({
      tagName: 'dd',
      block: false,
      seekable: true,
      noNewLine: true,
      compile(parser, buffer, token) {
        const parsed = parser.utils.transformAst(
          parser.utils.generateAST(token.properties.jsArg, token.loc, token.filename),
          token.filename,
          parser
        )

        /**
         * Dump/Die statement to catch error and convert it into
         * an Edge error
         */
        const ddStatement = [
          'try {',
          `  template.dumper.dd(${parser.utils.stringify(parsed)})`,
          '} catch (error) {',
          `  if (error.code === 'E_DUMP_DIE_EXCEPTION') {`,
          '    const edgeError = template.createError(error.message, $filename, $lineNumber)',
          '    error.fileName = $filename',
          '    error.lineNumber = $lineNumber',
          '    edgeError.handle = function (_, ctx) {',
          '      return error.handle(error, ctx)',
          '    }',
          '    edgeError.report = function () {',
          '      return error.report(error)',
          '    }',
          '    throw edgeError',
          '  }',
          '  throw error',
          '}',
        ].join('\n')

        buffer.writeStatement(ddStatement, token.filename, token.loc.start.line)
      },
    })
  }
}
