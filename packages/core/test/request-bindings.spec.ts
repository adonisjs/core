/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { requestBindings } from '../src/Bindings/Request'
import { Request } from '@adonisjs/request'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

test.group('Request Bindings | file', () => {
  test('add file method to the request class', (assert) => {
    requestBindings(Request)
    assert.exists(Request.prototype['file'])
  })

  test('calling file method should return the selected file', (assert) => {
    const req = new IncomingMessage(new Socket())
    const res = new ServerResponse(req)

    requestBindings(Request)
    const request = new Request(req, res, {
      allowMethodSpoofing: false,
      trustProxy: () => true,
      subdomainOffset: 2,
    })

    request['_files'] = {
      profile_pic: {
        setValidationOptions () {},
      },
    }

    assert.deepEqual(request['file']('profile_pic', {}), request['_files'].profile_pic)
  })

  test('calling file method should return the array of selected file', (assert) => {
    const req = new IncomingMessage(new Socket())
    const res = new ServerResponse(req)

    requestBindings(Request)
    const request = new Request(req, res, {
      allowMethodSpoofing: false,
      trustProxy: () => true,
      subdomainOffset: 2,
    })

    request['_files'] = {
      profile_pic: [{
        setValidationOptions () {},
      }],
    }

    assert.deepEqual(request['file']('profile_pic', {}), request['_files'].profile_pic)
  })

  test('return null when file doesn\'t exists', (assert) => {
    const req = new IncomingMessage(new Socket())
    const res = new ServerResponse(req)

    requestBindings(Request)
    const request = new Request(req, res, {
      allowMethodSpoofing: false,
      trustProxy: () => true,
      subdomainOffset: 2,
    })

    request['_files'] = {
    }

    assert.isNull(request['file']('profile_pic', {}))
  })
})
