/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import fs from 'node:fs'
import { ApplicationService } from './types.js'

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
 * Detects the assets bundler in use. The rcFile.assetsBundler is
 * used when exists.
 */
export async function detectAssetsBundler(app: ApplicationService) {
  if (app.rcFile.assetsBundler) {
    return app.rcFile.assetsBundler
  }

  if (fs.existsSync(app.makePath('vite.config.js'))) {
    return {
      name: 'vite',
      devServerCommand: 'vite',
      buildCommand: 'vite build',
    }
  }

  if (fs.existsSync(app.makePath('webpack.config.js'))) {
    return {
      name: 'encore',
      devServerCommand: 'encore dev-server',
      buildCommand: 'encore',
    }
  }
}
