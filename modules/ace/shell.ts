/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const DEFAULT_NODE_ARGS = [
  // Use ts-node/esm loader. The project must install it
  '--loader=ts-node/esm',
  // Disable annonying warnings
  '--no-warnings',
  // Enable expiremental meta resolve for cases where someone uses magic import string
  '--experimental-import-meta-resolve',
]

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
      const childProcess = execaNode('bin/console.js', argv, {
        nodeOptions: DEFAULT_NODE_ARGS,
        preferLocal: true,
        windowsHide: false,
        localDir: cwd,
        cwd,
        buffer: false,
        stdio: 'inherit',
      })

      childProcess.on('close', (exitCode) => {
        if (exitCode) {
          process.exitCode = exitCode
        }
      })

      childProcess.on('error', (error) => {
        console.error(error)
      })
    },
  }
}
