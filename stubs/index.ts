/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { getDirname } from '@poppinss/utils'

export const stubsRoot = getDirname(import.meta.url)
