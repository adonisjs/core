/*
* @adonisjs/dev-utils
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/**
 * Fake logger for stubbing
 */
export class FakeLogger {
 public logs: { method: string, data: any }[] = []

 public error (...values: any) {
   this.logs.push({ method: 'error', data: values })
 }

 public debug (...values: any) {
   this.logs.push({ method: 'debug', data: values })
 }

 public info (...values: any) {
   this.logs.push({ method: 'info', data: values })
 }

 public warn (...values: any) {
   this.logs.push({ method: 'warn', data: values })
 }

 public fatal (...values: any) {
   this.logs.push({ method: 'fatal', data: values })
 }

 public trace (...values: any) {
   this.logs.push({ method: 'trace', data: values })
 }

 public level = 'debug'

 public levels = { labels: {}, values: {} }

 public isLevelEnabled (level: string) {
   return this.level === level
 }
}
