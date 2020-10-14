/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { randomString } from '@poppinss/utils'
import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

const ENV_VALIDATIONS_TEMPLATE_STUB = join(__dirname, './templates', 'env.txt')
const STATIC_TEMPLATE_STUB = join(__dirname, './templates', 'config', 'static.txt')
const APP_CONFIG_TEMPLATE_STUB = join(__dirname, './templates', 'config', 'app.txt')

/**
 * Configure package
 */
export default async function instructions(
	projectRoot: string,
	_: ApplicationContract,
	{ logger, files }: typeof sinkStatic
) {
	const isApiBoilerplate = process.env['ADONIS_CREATE_APP_BOILERPLATE'] === 'api'

	/**
	 * Create app config file
	 */
	const appConfig = new files.MustacheFile(projectRoot, 'config/app.ts', APP_CONFIG_TEMPLATE_STUB)
	if (appConfig.exists()) {
		logger.action('create').skipped('config/app.ts', 'File already exists')
	} else {
		appConfig.apply({ forceContentNegotiationToJSON: isApiBoilerplate }).commit()
		logger.action('create').succeeded('config/app.ts')
	}

	/**
	 * Create static config file when boilerplate is not for the api
	 */
	if (!isApiBoilerplate) {
		const staticConfig = new files.MustacheFile(
			projectRoot,
			'config/static.ts',
			STATIC_TEMPLATE_STUB
		)
		if (staticConfig.exists()) {
			logger.action('create').skipped('config/static.ts', 'File already exists')
		} else {
			staticConfig.apply({}).commit()
			logger.action('create').succeeded('config/static.ts')
		}
	}

	/**
	 * Add `public` folder to the meta files when not selected api
	 * boilerplate
	 */
	if (!isApiBoilerplate) {
		const rcFile = new files.AdonisRcFile(projectRoot)
		rcFile.addMetaFile('public/**', false)
		rcFile.commit()
		logger.action(rcFile.exists() ? 'update' : 'create').succeeded('.adonisrc.json')
	}

	/**
	 * Create .env file for holding environment variables during
	 * development
	 */
	const env = new files.EnvFile(projectRoot)
	env.set('PORT', 3333)
	env.set('HOST', '0.0.0.0')
	env.set('NODE_ENV', 'development')
	env.set('APP_KEY', randomString(32))
	env.commit()
	logger.action(env.exists() ? 'update' : 'create').succeeded('.env,.env.example')

	/**
	 * Create env.ts file for performing environment variable validations
	 */
	const envTsFile = new files.MustacheFile(projectRoot, 'env.ts', ENV_VALIDATIONS_TEMPLATE_STUB)
	if (envTsFile.exists()) {
		logger.action('create').skipped('env.ts')
	} else {
		envTsFile.apply({}).commit()
		logger.action('create').succeeded('env.ts')
	}
}
