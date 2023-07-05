/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Ignitor } from './main.js'

/**
 * ReplProcess is used to start the REPL process
 */
export class ReplProcess {
  /**
   * Ignitor reference
   */
  #ignitor: Ignitor

  constructor(ignitor: Ignitor) {
    this.#ignitor = ignitor
  }

  /*
   * Start the app in REPL mode
   */
  async run() {
    const app = this.#ignitor.createApp('repl')
    await app.init()
    await app.boot()

    await app.start(async () => {
      const repl = await app.container.make('repl')
      repl.start()

      repl.server!.on('exit', async () => {
        await app.terminate()
      })
    })
  }
}
