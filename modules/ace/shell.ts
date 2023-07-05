/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { runNode } from '../../src/internal_helpers.js'

/**
 * Ace shell is used to run the ace commands inside a TypeScript project
 * without pre-compiling TypeScript source files.
 *
 * Under the hood a child process is used to execute the "bin/console.ts" file. This
 * is required because we have to use "ts-node/esm" loader in order to run TypeScript
 * files.
 */
export function aceShell(cwd: URL) {
  return {
    async handle(argv: string[]) {
      const { execaNode } = await import('execa')
      const childProcess = runNode(execaNode, cwd, {
        script: 'bin/console.ts',
        scriptArgs: argv,
      })

      try {
        const result = await childProcess
        process.exitCode = result.exitCode
      } catch (error) {
        process.exitCode = 1
      }
    },
  }
}
