/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { parseIocReference, callIocReference } from '@poppinss/utils'
import { HealthCheckContract, Checker, HealthReport, HealthReportEntry } from '@ioc:Adonis/Core/HealthCheck'

/**
 * The module exposes the API to find the health, liveliness and readiness of
 * the system. You can also add your own checkers.
 */
export class HealthCheck implements HealthCheckContract {
  /**
   * A copy of custom checkers
   */
  private _healthCheckers: { [service: string]: Checker } = {}

  constructor (private _application: ApplicationContract) {}

  /**
   * Invokes a given checker to collect the report metrics.
   */
  private async _invokeChecker (
    service: string,
    reportSheet: HealthReport,
  ): Promise<boolean> {
    const checker = this._healthCheckers[service]
    let report: HealthReportEntry

    try {
      if (typeof (checker) === 'function') {
        report = await checker()
      } else {
        report = await callIocReference(parseIocReference(`${checker}.report`), [])
      }
    } catch (error) {
      report = {
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
  public async isLive (): Promise<boolean> {
    if (!this.isReady()) {
      return false
    }

    const { healthy } = await this.report()
    return healthy
  }

  /**
   * Add a custom checker to check a given service connectivity
   * with the server
   */
  public addChecker (service: string, checker: Checker) {
    this._healthCheckers[service] = checker
  }

  /**
   * Ensure that application is ready and is not shutting
   * down. This relies on the application module.
   */
  public isReady () {
    return this._application.isReady && !this._application.isShuttingDown
  }

  /**
   * Returns the health check reports. The health checks are performed when
   * this method is invoked.
   */
  public async report (): Promise<{ healthy: boolean, report: HealthReport }> {
    const report: HealthReport = {}
    await Promise.all(Object.keys(this._healthCheckers).map((service) => {
      return this._invokeChecker(service, report)
    }))

    /**
     * Finding unhealthy service to know if system is healthy or not
     */
    const unhealthyService = Object.keys(report).find((service) => !report[service].health.healthy)
    return { healthy: !unhealthyService, report }
  }
}
