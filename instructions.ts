/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

const APP_TEMPLATE_STUB = join(__dirname, './templates', 'config', 'app.txt')
const STATIC_TEMPLATE_STUB = join(__dirname, './templates', 'config', 'static.txt')

export default async function instructions(
	projectRoot: string,
	_: ApplicationContract,
	{ logger, files }: typeof sinkStatic
) {
	const isApiBoilerplate = process.env['ADONIS_CREATE_APP_BOILERPLATE'] === 'api'

	/**
	 * Create app config file
	 */
	const appConfig = new files.MustacheFile(projectRoot, 'config/app.ts', APP_TEMPLATE_STUB)
	if (appConfig.exists()) {
		logger.skip('config/app.ts')
	} else {
		appConfig.apply({ forceContentNegotiationToJSON: isApiBoilerplate }).commit()
		logger.create('config/app.ts')
	}

	/**
	 * Create static config file when boilerplate
	 * is not for the api
	 */
	if (!isApiBoilerplate) {
		const staticConfig = new files.MustacheFile(
			projectRoot,
			'config/static.ts',
			STATIC_TEMPLATE_STUB
		)
		if (staticConfig.exists()) {
			logger.skip('config/static.ts')
		} else {
			staticConfig.apply({}).commit()
			logger.create('config/static.ts')
		}
	}
}
