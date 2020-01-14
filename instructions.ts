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

export default async function instructions (
  projectRoot: string,
  application: ApplicationContract,
  { executeInstructions, TemplateFile, logger }: typeof sinkStatic,
) {
  const template = new TemplateFile(
    projectRoot,
    'config/app.ts',
    join(__dirname, './config', 'app.txt'),
  )

  if (template.exists()) {
    logger.skip('config/app.ts')
  } else {
    template.apply({
      forceContentNegotiationToJSON: process.env['ADONIS_CREATE_APP_BOILERPLATE'] === 'api'
        ? true
        : false,
    })
    template.commit()
    logger.create('config/app.ts')
  }

  await executeInstructions('@adonisjs/events', projectRoot, application)
  await executeInstructions('@adonisjs/hash', projectRoot, application)
  await executeInstructions('@adonisjs/validator', projectRoot, application)
  await executeInstructions('@adonisjs/bodyparser', projectRoot, application)
}
