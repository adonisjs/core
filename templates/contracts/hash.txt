/**
 * Contract source: https://git.io/Jfefs
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

import { InferListFromConfig } from '@adonisjs/core/build/config'
import hashConfig from '../config/hash'

declare module '@ioc:Adonis/Core/Hash' {
  interface HashersList extends InferListFromConfig<typeof hashConfig> {}
}
