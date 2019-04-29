/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { Encryption } from '../src/Encryption'

test.group('Encryption', () => {
  test('encrypt value', (assert) => {
    const encryption = new Encryption('real secret keys should be long and random')
    assert.notEqual(encryption.encrypt('hello-world'), 'hello-world')
    assert.equal(encryption.decrypt(encryption.encrypt('hello-world')), 'hello-world')
  })

  test('get new instance of encryptor with different key', (assert) => {
    const encryption = new Encryption('real secret keys should be long and random')
    const customEncryptor = encryption.newInstance({ key: 'another secret key' })
    assert.isNull(encryption.decrypt(customEncryptor.encrypt('hello-world')))
  })

  test('get new instance of encryptor with hmac enabled', (assert) => {
    const encryption = new Encryption('real secret keys should be long and random')
    const customEncryptor = encryption.newInstance({ hmac: true })
    assert.isNull(encryption.decrypt(customEncryptor.encrypt('hello-world')))
  })

  test('base64 encode value', (assert) => {
    const encryption = new Encryption('real secret keys should be long and random')
    assert.equal(encryption.base64Decode(encryption.base64Encode('hello-world')), 'hello-world')

    const buff = new Buffer('hello-world')
    assert.equal(encryption.base64Decode(encryption.base64Encode(buff)), 'hello-world')
  })

  test('raise error when secret key is missing', (assert) => {
    const fn = () => new (Encryption as any)()
    assert.throw(fn, 'E_MISSING_APP_KEY: Define appKey inside config/app file')
  })
})
