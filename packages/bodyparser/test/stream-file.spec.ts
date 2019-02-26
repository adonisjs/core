/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { Filesystem } from '@adonisjs/dev-utils'
import { join } from 'path'
import { createReadStream, pathExists } from 'fs-extra'

import { streamFile } from '../src/Multipart/streamFile'

const fs = new Filesystem(join(__dirname, 'app'))
const SAMPLE_FILE = join(fs.basePath, 'hello-out.txt')
const MAIN_FILE = join(fs.basePath, 'hello-in.txt')

test.group('streamFile', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('write readable stream to the destination', async (assert) => {
    await fs.add(MAIN_FILE, 'hello')

    const file = createReadStream(MAIN_FILE)
    await streamFile(file, SAMPLE_FILE)

    const hasFile = await pathExists(SAMPLE_FILE)
    assert.isTrue(hasFile)
  })

  test('raise error when stream gets interuppted', async (assert) => {
    assert.plan(1)

    await fs.add(MAIN_FILE, 'hello\n\hi\nhow are you')

    const file = createReadStream(MAIN_FILE)
    file.on('readable', () => {
      file.emit('error', 'blowup')
    })

    try {
      await streamFile(file, SAMPLE_FILE)
    } catch (error) {
      assert.equal(error, 'blowup')
    }
  })
})
