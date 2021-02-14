/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The binding for the given module is defined inside `providers/AppProvider.ts`
 * file.
 */
declare module '@ioc:Adonis/Core/HealthCheck' {
  export type Checker = string | (() => Promise<HealthReportEntry>)

  /**
   * Shape of health report entry. Each checker must
   * return an object with similar shape.
   */
  export type HealthReportEntry = {
    displayName: string
    health: {
      healthy: boolean
      message?: string
    }
    meta?: any
  }

  /**
   * The shape of entire report
   */
  export type HealthReport = {
    [service: string]: HealthReportEntry
  }

  /**
   * Shape of health check contract
   */
  export interface HealthCheckContract {
    servicesList: string[]
    addChecker(service: string, checker: Checker): void
    isLive(): Promise<boolean>
    isReady(): boolean
    getReport(): Promise<{ healthy: boolean; report: HealthReport }>
  }

  const HealthCheck: HealthCheckContract
  export default HealthCheck
}
