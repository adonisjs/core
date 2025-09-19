/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type IndexEntitiesConfig } from '../types.ts'
import { type CommonHooks } from '@adonisjs/assembler/types'

/**
 * Configures the IndexGenerator to create barrel files for "controllers", "events",
 * and "listeners". This function is used as an assembler hook to automatically generate
 * index files that export all modules from specified directories.
 *
 * @param {IndexEntitiesConfig} entities - Configuration object for entities indexing
 *
 * @example
 * // Basic usage with default configuration
 * indexEntities({})
 *
 * @example
 * // Custom configuration for specific entities
 * indexEntities({
 *   events: {
 *     enabled: true,
 *     source: 'app/custom-events',
 *     importAlias: '#custom-events'
 *   },
 *   controllers: {
 *     enabled: false
 *   }
 * })
 *
 * @example
 * // Using custom glob patterns
 * indexEntities({
 *   listeners: {
 *     source: 'app/handlers',
 *     glob: '**\/*_handler.ts'
 *   }
 * })
 */
export function indexEntities(entities: IndexEntitiesConfig = {}): CommonHooks['init'][number] {
  const events = Object.assign(
    { enabled: true, source: 'app/events', importAlias: '#events' },
    entities.events
  )
  const listeners = Object.assign(
    { enabled: true, source: 'app/listeners', importAlias: '#listeners' },
    entities.listeners
  )
  const controllers = Object.assign(
    { enabled: true, source: 'app/controllers', importAlias: '#controllers' },
    entities.controllers
  )

  return {
    run(_, indexGenerator) {
      if (events.enabled) {
        indexGenerator.add('events', {
          source: events.source,
          glob: events.glob,
          as: 'barrelFile',
          exportName: 'events',
          importAlias: events.importAlias,
          output: '.adonisjs/server/events.ts',
        })
      }

      if (listeners.enabled) {
        indexGenerator.add('listeners', {
          source: listeners.source,
          glob: listeners.glob,
          as: 'barrelFile',
          exportName: 'listeners',
          importAlias: listeners.importAlias,
          output: '.adonisjs/server/listeners.ts',
        })
      }

      if (controllers.enabled) {
        indexGenerator.add('controllers', {
          source: controllers.source,
          glob: controllers.glob,
          as: 'barrelFile',
          exportName: 'controllers',
          importAlias: controllers.importAlias,
          removeSuffix: 'controller',
          output: '.adonisjs/server/controllers.ts',
        })
      }
    },
  }
}
