/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import diagnostics_channel from 'node:diagnostics_channel'
import { type AceCommandTracingData } from '../../types/ace.ts'

/**
 * Traces execution of Ace commands
 */
export const aceCommand = diagnostics_channel.tracingChannel<
  'adonisjs:ace.command',
  AceCommandTracingData
>('adonisjs:ace.command')
