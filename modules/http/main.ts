/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Bodyparser import is needed to merge types of Request
 * class augmented by the bodyparser package
 */
import '@adonisjs/bodyparser'
export * from '@adonisjs/http-server'
export { RequestValidator } from './request_validator.js'
