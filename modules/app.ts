/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Application module re-exports all functionality from @adonisjs/application.
 * This includes the main Application class and related types for managing
 * the AdonisJS application lifecycle, container bindings, and service providers.
 *
 * @example
 * // Import the Application class
 * import { Application } from '@adonisjs/core/app'
 *
 * const app = new Application(new URL('../', import.meta.url))
 * await app.init()
 * await app.boot()
 *
 * @example
 * // Import application types
 * import type { ApplicationService, ContainerBindings } from '@adonisjs/core/app'
 */
export * from '@adonisjs/application'
