/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { promisify } from 'node:util'
import { mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { test } from '@japa/runner'
import { type FileSystem } from '@japa/file-system'

const execFileAsync = promisify(execFile)

/**
 * Setup a TypeScript project by creating a "tsconfig.json" file and
 * "@poppinss/ts-exec" package within the node_modules.
 *
 * The "@poppinss/ts-exec" package is setup in a way to prevent missing module
 * errors. However, it does not offer actual runtime functionality.
 */
export const setupTypeScriptProject = test.macro(async ({ context }) => {
  const { fs } = context

  await fs.create(
    'tsconfig.json',
    JSON.stringify({
      include: ['**/*'],
    })
  )

  await fs.create(
    'node_modules/@poppinss/ts-exec/package.json',
    JSON.stringify({
      name: '@poppinss/ts-exec',
      exports: { '.': './index.js' },
    })
  )

  await fs.create('node_modules/@poppinss/ts-exec/index.js', '')
})

/**
 * Creates a git repository with a linked worktree inside the file system
 * root and returns the URL of the worktree directory.
 */
export async function setupGitWorktree(fs: FileSystem, worktreeName: string): Promise<URL> {
  await mkdir(fs.basePath, { recursive: true })
  await execFileAsync('git', ['init', 'main-repo'], { cwd: fs.basePath })

  const mainRepoPath = join(fs.basePath, 'main-repo')
  await execFileAsync(
    'git',
    [
      '-c',
      'user.name=AdonisJS',
      '-c',
      'user.email=test@adonisjs.com',
      'commit',
      '--allow-empty',
      '-m',
      'initial commit',
    ],
    { cwd: mainRepoPath }
  )
  await execFileAsync('git', ['worktree', 'add', join(fs.basePath, worktreeName)], {
    cwd: mainRepoPath,
  })

  return new URL(`./${worktreeName}/`, fs.baseUrl)
}

/**
 * Setup a fake adonis project in the file system
 */
export async function setupProject(
  fs: FileSystem,
  pkgManager?: 'npm' | 'pnpm' | 'yarn' | 'yarn@berry'
) {
  await fs.create(
    'package.json',
    JSON.stringify({ type: 'module', name: 'test', dependencies: {} })
  )

  if (pkgManager === 'pnpm') {
    await fs.create('pnpm-lock.yaml', '')
  } else if (pkgManager === 'yarn' || pkgManager === 'yarn@berry') {
    await fs.create('yarn.lock', '')
  } else {
    await fs.create('package-lock.json', '')
  }

  await fs.create('tsconfig.json', JSON.stringify({ compilerOptions: {} }))
  await fs.create('adonisrc.ts', `export default defineConfig({})`)
  await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
  await fs.create('start/kernel.ts', `export default Env.create(new URL('./'), {})`)
  await fs.create('.env', '')
}

/**
 * Setup a fake package inside the node_modules directory
 */
export async function setupPackage(fs: FileSystem, configureContent?: string) {
  await setupNamedPackage(fs, { name: 'foo', configureContent })
}

/**
 * Setup a fake package with a custom name inside the packages directory
 */
export async function setupNamedPackage(
  fs: FileSystem,
  options: { name: string; configureContent?: string }
) {
  await fs.create(
    `packages/${options.name}/package.json`,
    JSON.stringify({
      type: 'module',
      name: `@adonisjs/${options.name}`,
      main: 'index.js',
      dependencies: {},
    })
  )

  await fs.create(
    `packages/${options.name}/index.js`,
    `export const stubsRoot = './'
     export async function configure(command) { ${options.configureContent ?? ''} }`
  )
}
