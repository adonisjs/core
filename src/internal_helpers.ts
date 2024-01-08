/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { existsSync } from 'node:fs'
import { ApplicationService } from './types.js'
import { RcFile } from '@adonisjs/application/types'

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
export async function detectAssetsBundler(
  app: ApplicationService
): Promise<RcFile['assetsBundler']> {
  if (app.rcFile.assetsBundler) {
    return app.rcFile.assetsBundler
  }

  const possibleViteConfigFiles = generateJsFilenames('vite.config')
  if (possibleViteConfigFiles.some((config) => existsSync(app.makePath(config)))) {
    return {
      name: 'vite',
      devServer: { command: 'vite' },
      build: { command: 'vite', args: ['build'] },
    }
  }

  const possibleEncoreConfigFiles = generateJsFilenames('webpack.config')
  if (possibleEncoreConfigFiles.some((config) => existsSync(app.makePath(config)))) {
    return {
      name: 'encore',
      devServer: { command: 'encore', args: ['dev-server'] },
      build: { command: 'encore', args: ['production'] },
    }
  }
}
