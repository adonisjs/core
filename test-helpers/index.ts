/*
 * @adonisjs/ace
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/application'

const SECRET = 'asecureandlongrandomsecret'
export const fs = new Filesystem(join(__dirname, '__app'))

/**
 * Setup application files for testing
 */
export async function setupApplicationFiles(
  additionalProviders?: string[],
  serveFiles: boolean = false
) {
  await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

  const providers = Array.isArray(additionalProviders)
    ? additionalProviders.concat(join(__dirname, '../providers/AppProvider.ts'))
    : [join(__dirname, '../providers/AppProvider.ts')]

  await fs.add(
    '.adonisrc.json',
    JSON.stringify({
      autoloads: {
        App: './app',
      },
      providers: providers,
    })
  )

  await fs.add(
    'app/Exceptions/Handler.ts',
    `
  export default class ExceptionHandler {
  }`
  )

  await fs.add(
    'config/app.ts',
    `
    export const appKey = '${SECRET}'
    export const http = {
      trustProxy () {
        return true
      },
      cookie: {}
    }
    export const logger = {
      enabled: true,
      name: 'adonisjs',
      level: 'info',
    }
  `
  )

  await fs.add(
    'config/drive.ts',
    `
    const driveConfig = {
      disk: 'local',
      disks: {
        local: {
          driver: 'local',
          serveFiles: ${serveFiles},
          basePath: '/uploads',
          root: '${fs.basePath}'
        }
      }
    }

    export default driveConfig
  `
  )

  await fs.add('.env', `APP_KEY = ${SECRET}`)
}

/**
 * Setup application for testing
 */
export async function setupApp(additionalProviders?: string[], serveAssets: boolean = false) {
  await setupApplicationFiles(additionalProviders, serveAssets)
  const app = new Application(fs.basePath, 'web')

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()

  return app
}

export async function registerBodyParserMiddleware(app: Application) {
  app.container.use('Adonis/Core/Server').middleware.clear()
  app.container.use('Adonis/Core/Server').middleware.register([
    async () => {
      return {
        default: app.container.use('Adonis/Core/BodyParser'),
      }
    },
  ])

  app.container.use('Adonis/Core/Config').set('bodyparser', {
    whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    json: {
      types: [],
    },
    form: {
      types: [],
    },
    raw: {
      types: [],
    },
    multipart: {
      processManually: [],
      autoProcess: true,
      types: ['multipart/form-data'],
    },
  })
}
