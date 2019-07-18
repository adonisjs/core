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
import { Application } from '@poppinss/application'

const templates = ['app.ts', 'cors.ts', 'hash.ts']

/**
 * Copying config template to the app.
 */
export default function instructions (
  projectRoot: string,
  application: Application,
  { TemplateFile }: typeof sinkStatic,
) {
  templates.forEach((filename) => {
    new TemplateFile(
      projectRoot,
      application.configPath(filename),
      join(__dirname, './config/app.ts'),
    )
      .apply({})
      .commit()
  })
}
