/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from './app.js'
import type { Dumper } from '../modules/dumper/dumper.js'

let dumper: Dumper

/**
 * dumper service is an instance of the "Dumper" class stored inside
 * the "modules/dumper/dumper.ts" file
 */
await app.booted(async () => {
  dumper = await app.container.make('dumper')
})

/**
 * Dump a value and die. The dumped value will be displayed
 * using the HTML printer during an HTTP request or within
 * the console otherwise.
 */
export const dd = (value: unknown) => {
  dumper.dd(value, 2)
}
