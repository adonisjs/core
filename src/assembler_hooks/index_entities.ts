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
 * @param {object} [entities.events] - Configuration for events indexing
 * @param {boolean} [entities.events.enabled=true] - Whether to enable events indexing
 * @param {string} [entities.events.source='app/events'] - Source directory for events
 * @param {string} [entities.events.importAlias='#events'] - Import alias for events
 * @param {string} [entities.events.glob] - Glob pattern for matching event files
 * @param {object} [entities.listeners] - Configuration for listeners indexing
 * @param {boolean} [entities.listeners.enabled=true] - Whether to enable listeners indexing
 * @param {string} [entities.listeners.source='app/listeners'] - Source directory for listeners
 * @param {string} [entities.listeners.importAlias='#listeners'] - Import alias for listeners
 * @param {string} [entities.listeners.glob] - Glob pattern for matching listener files
 * @param {object} [entities.controllers] - Configuration for controllers indexing
 * @param {boolean} [entities.controllers.enabled=true] - Whether to enable controllers indexing
 * @param {string} [entities.controllers.source='app/controllers'] - Source directory for controllers
 * @param {string} [entities.controllers.importAlias='#controllers'] - Import alias for controllers
 * @param {string} [entities.controllers.glob] - Glob pattern for matching controller files
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
