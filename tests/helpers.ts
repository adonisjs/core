/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

/**
 * Setup a TypeScript project by creating a "tsconfig.json" file and
 * "@poppinss/ts-exec" package within the node_modules.
 *
 * The "@poppinss/ts-exec" package is setup in a way to prevent missing module
 * errors. However, it does not offer actual runtime functionality.
 */
export const setupTypeScriptProject = test.macro(async ({ context }) => {
  const { fs } = context

  await fs.create(
    'tsconfig.json',
    JSON.stringify({
      include: ['**/*'],
    })
  )

  await fs.create(
    'node_modules/@poppinss/ts-exec/package.json',
    JSON.stringify({
      name: '@poppinss/ts-exec',
      exports: { '.': './index.js' },
    })
  )

  await fs.create('node_modules/@poppinss/ts-exec/index.js', '')
})
