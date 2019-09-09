/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import * as sinkStatic from '@adonisjs/sink'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default async function instructions (
  projectRoot: string,
  application: ApplicationContract,
  { executeInstructions }: typeof sinkStatic,
) {
  await executeInstructions('@adonisjs/hash', projectRoot, application)
}
