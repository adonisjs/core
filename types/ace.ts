/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CommandOptions as BaseCommandOptions } from '@adonisjs/ace/types'
export type CommandOptions = BaseCommandOptions & {
  startApp?: boolean
}

export * from '@adonisjs/ace/types'
