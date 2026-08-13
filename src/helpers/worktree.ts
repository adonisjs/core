/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createHash } from 'node:crypto'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EnvLoader, EnvParser } from '@adonisjs/env'

/**
 * The number of available port offsets. The offset is computed by
 * hashing the worktree name and mapping it to a value within this range,
 * so that the final port stays close to the base port.
 */
const PORT_RANGE = 1000

/**
 * Returns the name of the git worktree the application is running inside.
 * Returns "undefined" when the application is not running inside a linked
 * git worktree (for example the main checkout or a non-git directory).
 *
 * A linked git worktree is detected by looking for a ".git" file, since
 * git creates a file (and not a directory) at the root of linked worktrees
 * that points to the main repository. The worktree name is derived from
 * the name of the directory holding the ".git" file.
 *
 * @param appRoot - The application root directory URL
 *
 * @example
 * getWorktreeName(new URL('./', import.meta.url))
 * // Returns the directory name when running inside a linked worktree
 */
export function getWorktreeName(appRoot: URL): string | undefined {
  let currentPath = fileURLToPath(appRoot)

  while (true) {
    const gitPath = join(currentPath, '.git')
    if (existsSync(gitPath)) {
      /**
       * A linked worktree has a ".git" file pointing to the main repository,
       * while the main checkout has a ".git" directory
       */
      if (statSync(gitPath).isFile()) {
        return basename(currentPath)
      }

      return undefined
    }

    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) {
      return undefined
    }

    currentPath = parentPath
  }
}

/**
 * Returns the base port defined inside the application dot-env files.
 * The PORT value from the loaded dot-env files is used (following the
 * same priority as the environment loading), otherwise falls back to
 * the default port 3333.
 *
 * @param appRoot - The application root directory URL
 *
 * @example
 * await getBasePort(new URL('./', import.meta.url))
 */
export async function getBasePort(appRoot: URL): Promise<number> {
  const files = await new EnvLoader(appRoot).load()
  for (const file of files) {
    const envVariables = await new EnvParser(file.contents, appRoot).parse()
    if (envVariables.PORT) {
      return Number(envVariables.PORT)
    }
  }

  return 3333
}

/**
 * Computes a deterministic port for a given worktree name by adding a
 * stable offset to the base port. The offset is derived from the hash of
 * the worktree name, therefore the same worktree name always resolves to
 * the same port.
 *
 * @param worktreeName - The name of the worktree
 * @param basePort - The base port defined in the application
 *
 * @example
 * computeWorktreePort('feature-login', 3333)
 */
export function computeWorktreePort(worktreeName: string, basePort: number): number {
  const hash = createHash('sha1').update(worktreeName).digest()
  const offset = hash.readUInt32BE(0) % PORT_RANGE
  return basePort + offset
}
