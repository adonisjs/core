/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import staticServer from 'serve-static'
import { AssetsConfig } from '@ioc:Adonis/Core/Static'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * A simple server hook to serve static files from the public directory.
 * The public directory must be configured within the `.adonisrc.json`
 * file.
 */
export class ServeStatic {
	private serve = staticServer(this.publicPath, this.config)

	constructor(private publicPath: string, private config: AssetsConfig) {}

	/**
	 * Handle the request to serve static files.
	 */
	public async handle({ request, response }: HttpContextContract): Promise<void> {
		return new Promise((resolve) => {
			function next() {
				response.response.removeListener('finish', next)
				resolve()
			}

			/**
			 * Whether or not the file has been served by serve static, we
			 * will cleanup the finish event listener.
			 *
			 * 1. If file has been served, then the `finish` callback get invoked.
			 * 2. If file has not been served, then callback (3rd argument) will
			 *    get invoked.
			 */
			response.response.addListener('finish', next)
			this.serve(request.request, response.response, next)
		})
	}
}
