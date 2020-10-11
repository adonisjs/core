/*
 * @adonisjs/ace
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Application } from '@adonisjs/application'
import { Filesystem } from '@poppinss/dev-utils'

const SECRET = 'asecureandlongrandomsecret'
export const fs = new Filesystem(join(__dirname, '__app'))

/**
 * Setup application files for testing
 */
export async function setupApplicationFiles(additionalProviders?: string[]) {
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

	await fs.add('.env', `APP_KEY = ${SECRET}`)
}

/**
 * Setup application for testing
 */
export async function setupApp(additionalProviders?: string[]) {
	await setupApplicationFiles(additionalProviders)
	const app = new Application(fs.basePath, 'web')

	app.setup()
	app.registerProviders()
	await app.bootProviders()

	return app
}
