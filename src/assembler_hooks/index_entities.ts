/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type CommonHooks } from '@adonisjs/assembler/types'
import stringHelpers from '../helpers/string.ts'
import { type IndexEntitiesConfig } from '../types.ts'
import { outputTransformerDataObjects } from '../utils.ts'

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
export function indexEntities(entities: IndexEntitiesConfig = {}) {
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
  const transformers = Object.assign(
    {
      enabled: false,
      source: 'app/transformers',
      importAlias: '#transformers',
      withSharedProps: false,
    },
    entities.transformers
  )

  return {
    run(_, indexGenerator) {
      if (events.enabled) {
        indexGenerator.add('events', {
          source: events.source,
          disableLazyImports: true,
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

      if (transformers.enabled) {
        indexGenerator.add('transformers', {
          source: transformers.source,
          glob: transformers.glob,
          as(vfs, buffer, __, helpers) {
            const transformersList = vfs.asTree({
              transformKey(key) {
                const segments = key.split('/')
                const baseName = segments.pop()!
                return [
                  ...segments.map((segment) => stringHelpers.pascalCase(segment)),
                  stringHelpers.create(baseName).removeSuffix('transformer').pascalCase(),
                ].join('/')
              },
              transformValue: helpers.toImportPath,
            })
            outputTransformerDataObjects(transformersList, buffer, transformers.withSharedProps)
          },
          importAlias: transformers.importAlias,
          output: '.adonisjs/client/data.d.ts',
        })
      }
    },
  } satisfies CommonHooks['init'][number]
}
