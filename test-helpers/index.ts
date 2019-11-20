/*
* @adonisjs/ace
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'

const SECRET = 'asecureandlongrandomsecret'

export async function setupApplicationFiles (fs: Filesystem, additionalProviders?: string[]) {
  await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

  await fs.add('.adonisrc.json', JSON.stringify({
    autoloads: {
      'App': './app',
    },
  }))

  await fs.add(`config/app.ts`, `
    export const appKey = '${SECRET}'
    export const http = {
      trustProxy () {
        return true
      }
    }
  `)

  await fs.add('.env', `APP_KEY = ${SECRET}`)

  const providers = Array.isArray(additionalProviders)
    ? additionalProviders.concat(join(__dirname, '../providers/AppProvider.ts'))
    : [join(__dirname, '../providers/AppProvider.ts')]

  await fs.add(`start/app.ts`, `export const providers = [
    ${providers.map((one) => `'${one}',`).join('\n')}
  ]`)
}
