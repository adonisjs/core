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

const SECRET = 'asecureandlongrandomsecret'

/**
 * Setup typescript application files for testing
 */
export async function setupApplicationFiles(fs: Filesystem, additionalProviders?: string[]) {
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
 * Creates compiled files
 */
export async function setupCompiledApplicationFiles(
	fs: Filesystem,
	outDir: string,
	additionalProviders?: string[]
) {
	await fs.fsExtra.ensureDir(join(fs.basePath, outDir, 'config'))
	await fs.fsExtra.copyFile(join(fs.basePath, '.env'), join(fs.basePath, outDir, '.env'))
	await fs.add(
		`${outDir}/.adonisrc.json`,
		JSON.stringify(require(join(fs.basePath, '.adonisrc.json')))
	)

	await fs.add(
		`${outDir}/config/app.js`,
		`
    module.exports = {
      appKey: '${SECRET}',
      http: {
        trustProxy () {
          return true
        },
        cookie: {}
			},
			logger: {
				enabled: true,
				name: 'adonisjs',
				level: 'info',
			},
    }
  `
	)

	const providers = Array.isArray(additionalProviders)
		? additionalProviders.concat(join(__dirname, '../providers/AppProvider.ts'))
		: [join(__dirname, '../providers/AppProvider.ts')]

	await fs.add(
		`${outDir}/start/app.js`,
		`module.exports = {
    providers: [
      ${providers.map((one) => `'${one}',`).join('\n')}
    ],
  }`
	)
}
