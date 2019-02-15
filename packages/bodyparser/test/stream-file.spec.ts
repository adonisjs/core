/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { createReadStream, remove, pathExists, outputFile } from 'fs-extra'
import { join } from 'path'

import { streamFile } from '../src/streamFile'

const SAMPLE_FILE = join(__dirname, 'hello-out.txt')
const MAIN_FILE = join(__dirname, 'hello-in.txt')

test.group('streamFile', (group) => {
  group.afterEach(async () => {
    await Promise.all([remove(MAIN_FILE), remove(SAMPLE_FILE)])
  })

  test('write readable stream to the destination', async (assert) => {
    await outputFile(MAIN_FILE, 'hello')

    const file = createReadStream(MAIN_FILE)
    await streamFile(file, SAMPLE_FILE)

    const hasFile = await pathExists(SAMPLE_FILE)
    assert.isTrue(hasFile)
  })

  test('raise error when stream gets interuppted', async (assert) => {
    assert.plan(1)

    await outputFile(MAIN_FILE, 'hello\n\hi\nhow are you')

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

  test('raise error when stream exceeds the bytes limit', async (assert) => {
    assert.plan(1)

    await outputFile(MAIN_FILE, 'hello\n\hi\nhow are you')

    const file = createReadStream(MAIN_FILE)
    try {
      await streamFile(file, SAMPLE_FILE, 1)
    } catch (error) {
      assert.equal(error.message, 'E_UNALLOWED_FILE_SIZE: stream size exceeded')
    }
  })
})
