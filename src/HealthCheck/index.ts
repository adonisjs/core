/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

import {
	Checker,
	HealthReport,
	HealthReportEntry,
	HealthCheckContract,
} from '@ioc:Adonis/Core/HealthCheck'

/**
 * The module exposes the API to find the health, liveliness and readiness of
 * the system. You can also add your own checkers.
 */
export class HealthCheck implements HealthCheckContract {
	/**
	 * A copy of registered checkers
	 */
	private healthCheckers: { [service: string]: Checker } = {}

	/**
	 * Reference to the IoC container to resolve health checkers
	 */
	private resolver = this.application.container.getResolver('report')

	/**
	 * Returns an array of registered services names
	 */
	public get servicesList(): string[] {
		return Object.keys(this.healthCheckers)
	}

	constructor(private application: ApplicationContract) {}

	/**
	 * Invokes a given checker to collect the report metrics.
	 */
	private async invokeChecker(service: string, reportSheet: HealthReport): Promise<boolean> {
		const checker = this.healthCheckers[service]
		let report: HealthReportEntry

		try {
			if (typeof checker === 'function') {
				report = await checker()
			} else {
				report = await this.resolver.call(checker)
			}
			report.displayName = report.displayName || service
		} catch (error) {
			report = {
				displayName: service,
				health: { healthy: false, message: error.message },
				meta: { fatal: true },
			}
		}

		reportSheet[service] = report
		return report.health.healthy
	}

	/**
	 * A boolean to know, if all health checks have passed
	 * or not.
	 */
	public async isLive(): Promise<boolean> {
		if (!this.isReady()) {
			return false
		}

		const { healthy } = await this.getReport()
		return healthy
	}

	/**
	 * Add a custom checker to check a given service connectivity
	 * with the server
	 */
	public addChecker(service: string, checker: Checker) {
		this.healthCheckers[service] = checker
	}

	/**
	 * Ensure that application is ready. This relies on the application module.
	 */
	public isReady() {
		return this.application.isReady
	}

	/**
	 * Returns the health check reports. The health checks are performed when
	 * this method is invoked.
	 */
	public async getReport(): Promise<{ healthy: boolean; report: HealthReport }> {
		const report: HealthReport = {}

		await Promise.all(
			Object.keys(this.healthCheckers).map((service) => {
				return this.invokeChecker(service, report)
			})
		)

		/**
		 * Finding unhealthy service to know if system is healthy or not
		 */
		const unhealthyService = Object.keys(report).find((service) => !report[service].health.healthy)
		return { healthy: !unhealthyService, report }
	}
}
