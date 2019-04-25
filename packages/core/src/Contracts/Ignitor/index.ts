/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Preload file node. It must be defined as it is
 * inside `.adonisrc.json` file
*/
export type PreloadNode = {
  file: string,
  intent: string,
  optional: boolean,
}

/**
 * Shape of `.adonisrc.json` file
*/
export type RcFileNode = {
  typescript: boolean,
  exceptionHandlerNamespace?: string,
  preloads: PreloadNode[],
  autoloads: { [alias: string]: string },
  directories: { [identifier: string]: string },
}
