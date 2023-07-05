/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { existsSync } from 'node:fs'
import { ApplicationService, RunNodeOptions } from './types.js'

const DEFAULT_NODE_ARGS = [
  // Use ts-node/esm loader. The project must install it
  '--loader=ts-node/esm',
  // Disable annonying warnings
  '--no-warnings',
  // Enable expiremental meta resolve for cases where someone uses magic import string
  '--experimental-import-meta-resolve',
]

/**
 * Runs a Node.js script as a child process and inherits the stdio streams
 *
 * We must pass execaNode as an argument, so we can import it dynamically
 */
export function runNode(
  execaNode: typeof import('execa').execaNode,
  cwd: string | URL,
  options: RunNodeOptions
) {
  const childProcess = execaNode(options.script, options.scriptArgs, {
    nodeOptions: DEFAULT_NODE_ARGS.concat(options.nodeArgs || []),
    preferLocal: true,
    windowsHide: false,
    localDir: cwd,
    cwd,
    buffer: false,
    stdio: options.stdio || 'inherit',
    env: {
      ...(options.stdio === 'pipe' ? { FORCE_COLOR: 'true' } : {}),
      ...options.env,
    },
  })

  return childProcess
}

/**
 * Imports ts-node optionally
 */
export async function importTsNode(
  app: ApplicationService
): Promise<typeof import('ts-node') | undefined> {
  try {
    return await app.importDefault('ts-node')
  } catch {}
}

/**
 * Imports assembler optionally
 */
export async function importAssembler(
  app: ApplicationService
): Promise<typeof import('@adonisjs/assembler') | undefined> {
  try {
    return await app.import('@adonisjs/assembler')
  } catch {}
}

/**
 * Imports typescript optionally
 */
export async function importTypeScript(
  app: ApplicationService
): Promise<typeof import('typescript') | undefined> {
  try {
    return await app.importDefault('typescript')
  } catch {}
}

/**
 * Generates an array of filenames with different JavaScript
 * extensions for the given filename
 */
function generateJsFilenames(filename: string) {
  const extensions = ['.js', '.ts', '.cjs', '.mjs', '.cts', '.mts']
  return extensions.map((extension) => filename + extension)
}

/**
 * Detects the assets bundler in use. The rcFile.assetsBundler is
 * used when exists.
 */
export async function detectAssetsBundler(app: ApplicationService) {
  if (app.rcFile.assetsBundler) {
    return app.rcFile.assetsBundler
  }

  const possibleViteConfigFiles = generateJsFilenames('vite.config')
  if (possibleViteConfigFiles.some((config) => existsSync(app.makePath(config)))) {
    return {
      name: 'vite',
      devServer: { command: 'vite' },
      build: { command: 'vite build' },
    }
  }

  const possibleEncoreConfigFiles = generateJsFilenames('webpack.config')
  if (possibleEncoreConfigFiles.some((config) => existsSync(app.makePath(config)))) {
    return {
      name: 'encore',
      devServer: { command: 'encore dev-server' },
      build: { command: 'encore production' },
    }
  }
}
