/*
* @adonisjs/bodyparser
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import * as test from 'japa'
import { FormFields } from '../src/FormFields'

test.group('Form Fields Parser', () => {
  test('add a plain key value pair to form fields', (assert) => {
    const formFields = new FormFields()
    formFields.add('name', 'foo')
    assert.deepEqual(formFields.get(), { name: 'foo' })
  })

  test('add an array of key value pair to form fields', (assert) => {
    const formFields = new FormFields()
    formFields.add('name[]', 'foo')
    assert.deepEqual(formFields.get(), { name: ['foo'] })
  })

  test('add an array of key value pair to form fields multiple times', (assert) => {
    const formFields = new FormFields()
    formFields.add('name[]', 'foo')
    formFields.add('name[]', 'bar')
    assert.deepEqual(formFields.get(), { name: ['foo', 'bar'] })
  })

  test('add a key with nested arrays', (assert) => {
    const formFields = new FormFields()
    formFields.add('user[email]', 'foo@bar.com')
    formFields.add('user[age]', 22)
    assert.deepEqual(formFields.get(), { user: { email: 'foo@bar.com', age: 22 } })
  })

  test('add a key with deep nested arrays', (assert) => {
    const formFields = new FormFields()
    formFields.add('user[email[]]', 'foo@bar.com')
    formFields.add('user[email[]]', 'foo@baz.com')
    formFields.add('user[age]', 22)
    assert.deepEqual(formFields.get(), { user: { email: ['foo@bar.com', 'foo@baz.com'], age: 22 } })
  })

  test('add arrays with indexes', (assert) => {
    const formFields = new FormFields()
    formFields.add('user[1]', 'bar@baz.com')
    formFields.add('user[0]', 'foo@baz.com')
    assert.deepEqual(formFields.get(), { user: ['foo@baz.com', 'bar@baz.com'] })
  })
})
