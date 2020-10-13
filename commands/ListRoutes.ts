/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseCommand, flags } from '@adonisjs/ace'
import type { RouterContract, RouteNode } from '@ioc:Adonis/Core/Route'

/**
 * A command to display a list of routes
 */
export default class ListRoutes extends BaseCommand {
	public static commandName = 'list:routes'
	public static description = 'List application routes'

	@flags.boolean({ description: 'Output as JSON' })
	public json: boolean

	/**
	 * Load application
	 */
	public static settings = {
		loadApp: true,
	}

	/**
	 * Find route from the routes store. We expect it to always return a route
	 */
	private findRoute(
		router: any,
		domain: string,
		methods: string[],
		pattern: string
	): RouteNode | undefined {
		return router['store']['tree'].domains[domain][methods[0]].routes[pattern]
	}

	/**
	 * Returns an array of routes as JSON
	 */
	private outputJSON(router: RouterContract) {
		return router.toJSON().map((lookupRoute) => {
			const route = this.findRoute(
				router,
				lookupRoute.domain,
				lookupRoute.methods,
				lookupRoute.pattern
			)

			let handler: string = 'Closure'
			const middleware = route
				? route.middleware.map((one) => (typeof one === 'function' ? 'Closure' : one))
				: []

			if (route) {
				if (route.meta.resolvedHandler!.type !== 'function' && route.meta.namespace) {
					handler = `${route.meta.resolvedHandler!['namespace']}.${
						route.meta.resolvedHandler!['method']
					}`
				} else if (route.meta.resolvedHandler!.type !== 'function') {
					const method = route.meta.resolvedHandler!['method']
					const routeHandler = route.handler as string
					handler = `${routeHandler.replace(new RegExp(`.${method}$`), '')}.${method}`
				}
			} else if (typeof lookupRoute.handler === 'string') {
				handler = lookupRoute.handler
			}

			return {
				methods: lookupRoute.methods,
				name: lookupRoute.name || '',
				pattern: lookupRoute.pattern,
				handler: handler,
				domain: lookupRoute.domain === 'root' ? '' : lookupRoute.domain,
				middleware: middleware,
			}
		})
	}

	/**
	 * Output routes a table string
	 */
	private outputTable(router: RouterContract) {
		const table = this.ui.table().head(['Route', 'Handler', 'Middleware', 'Name', 'Domain'])

		this.outputJSON(router).forEach((route) => {
			const row = [
				`${this.colors.dim(route.methods.join(','))} ${route.pattern}`,
				typeof route.handler === 'function' ? 'Closure' : route.handler,
				route.middleware.join(','),
				route.name,
				route.domain,
			]
			table.row(row)
		})

		table.render()
	}

	/**
	 * Log message
	 */
	private log(message: string) {
		if (this.application.environment === 'test') {
			this.logger.log(message)
		} else {
			console.log(message)
		}
	}

	public async run() {
		const Router = this.application.container.use('Adonis/Core/Route')

		/**
		 * Commit routes before we can read them
		 */
		Router.commit()

		if (this.json) {
			this.log(JSON.stringify(this.outputJSON(Router), null, 2))
		} else {
			this.outputTable(Router)
		}
	}
}
