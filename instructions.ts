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
import { ApplicationContract } from '@poppinss/application'

const templates = ['app.ts', 'cors.ts', 'hash.ts']

/**
 * Copying config template to the app.
 */
export default function instructions (
  projectRoot: string,
  application: ApplicationContract,
  { TemplateFile }: typeof sinkStatic,
) {
  templates.forEach((filename) => {
    const dest = `${application.directoriesMap.get('config')}/${filename}`
    const src = join(__dirname, 'config', filename.replace(/.ts$/, '.txt'))

    new TemplateFile(projectRoot, dest, src)
      .apply({})
      .commit()
  })
}
