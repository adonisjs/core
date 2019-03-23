/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export interface HelpersContract {
  directories: {
    [name: string]: string,
  },
  appRoot (...paths: string[]): string,
  publicPath (...paths: string[]): string,
  configPath (...paths: string[]): string,
  databasePath (...paths: string[]): string,
  migrationsPath (...paths: string[]): string,
  seedsPath (...paths: string[]): string,
  resourcesPath (...paths: string[]): string,
  viewsPath (...paths: string[]): string,
  tmpPath (...paths: string[]): string,
  sleep (time: number): Promise<void>,
}
