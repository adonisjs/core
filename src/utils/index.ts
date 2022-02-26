/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { createServer } from 'http'
import { Kernel, ManifestLoader } from '@adonisjs/ace'
import { ServerContract } from '@ioc:Adonis/Core/Server'
import { resolveFrom } from '@poppinss/utils/build/helpers'
import { CustomServerCallback } from '@ioc:Adonis/Core/TestUtils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Registers the ts hook to compile typescript code within the memory
 */
export function registerTsHook(appRoot: string) {
  try {
    require(resolveFrom(appRoot, '@adonisjs/assembler/build/src/requireHook')).default(appRoot)
  } catch (error) {
    if (['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code!)) {
      throw new Error(
        'AdonisJS requires "@adonisjs/assembler" in order to run typescript source directly'
      )
    }

    throw error
  }
}

/**
 * Creates the AdonisJS HTTP server. The method is abstracted to be used by
 * test utils and the HTTP server process both.
 */
export function createHttpServer(
  application: ApplicationContract,
  server: ServerContract,
  callback?: CustomServerCallback
) {
  /**
   * Optimizing the server by pre-compiling routes and middleware
   */
  application.logger.trace('optimizing http server handler')
  server.optimize()

  /**
   * Bind exception handler to handle exceptions occured during HTTP requests.
   */
  if (application.exceptionHandlerNamespace) {
    application.logger.trace('binding %s exception handler', application.exceptionHandlerNamespace)
    server.errorHandler(application.exceptionHandlerNamespace)
  }

  const handler = server.handle.bind(server)
  server.instance = callback ? callback(handler) : createServer(handler)
}

/**
 * Helper function to optionally resolve files from a given path
 */
function resolve(fromPath: string, resolvePath: string, onMatch: (path: string) => void) {
  try {
    onMatch(resolveFrom(fromPath, resolvePath))
  } catch {
    return null
  }
}

/**
 * Loads ace commands from the assembler manifest and the app manifest files
 */
export function loadAceCommands(application: ApplicationContract, ace: Kernel) {
  const manifestFiles: { basePath: string; manifestAbsPath: string }[] = []

  resolve(application.appRoot, '@adonisjs/assembler/build/ace-manifest.json', (manifestAbsPath) => {
    const basePath = join(manifestAbsPath, '../')
    manifestFiles.push({ manifestAbsPath, basePath })
  })

  resolve(application.appRoot, './ace-manifest.json', (manifestAbsPath) => {
    const basePath = join(manifestAbsPath, '../')
    manifestFiles.push({ manifestAbsPath, basePath })
  })

  /**
   * Load commands using manifest loader
   */
  ace.useManifest(new ManifestLoader(manifestFiles))
  return ace.preloadManifest()
}
