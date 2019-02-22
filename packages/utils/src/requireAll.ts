/*
 * @
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname } from 'path'
import * as rAll from 'require-all'

/**
 * Entertain esm default exports
 */
function esmResolver (output) {
  return output && output.__esModule && output.default ? output.default : output
}

/**
 * Function to filter selected files only
 */
function fileFilter (file) {
  const ext = extname(file)
  if (ext === '.ts' && !file.endsWith('.d.ts')) {
    return file.replace(new RegExp(`${ext}$`), '')
  }

  if (['.js', '.json'].includes(ext)) {
    return file.replace(new RegExp(`${ext}$`), '')
  }

  return false
}

/**
 * Require all files from a given directory. The method automatically looks
 * for files ending with `.ts`, `.js` and `.json`. Also files ending with
 * `.d.ts` are ignored.
 */
export function requireAll (location: string, recursive = true, optional = false) {
  try {
    return rAll({
      dirname: location,
      recursive,
      filter: fileFilter,
      resolve: esmResolver,
    })
  } catch (error) {
    if (error.code === 'ENOENT' && optional) {
      return
    } else {
      throw error
    }
  }
}
