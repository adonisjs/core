/**
 * adonis-manager
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import { Manager } from '../index'

interface Mailable {
  send ()
}

test.group('Manager', () => {
  test('raise error when driver doesn\'t exists', (assert) => {
    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = false
      protected getDefaultDriver () {
        return 'smtp'
      }
    }

    const mail = new Mail({})
    const fn = () => mail.driver()

    assert.throw(fn, 'smtp driver is not supported by Mail')
  })

  test('resolve default driver when no name is defined', (assert) => {
    class Smtp implements Mailable {
      public send () {}
    }

    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = false
      protected getDefaultDriver () {
        return 'smtp'
      }

      public createSmtp (): Mailable {
        return new Smtp()
      }
    }

    const mail = new Mail({})
    const driver = mail.driver()
    assert.instanceOf(driver, Smtp)
  })

  test('resolve named driver when name is defined', (assert) => {
    class Mailgun implements Mailable {
      public send () {}
    }

    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = false
      protected getDefaultDriver () {
        return 'smtp'
      }

      public createMailgun (): Mailable {
        return new Mailgun()
      }
    }

    const mail = new Mail({})
    const driver = mail.driver('mailgun')
    assert.instanceOf(driver, Mailgun)
  })

  test('extend by adding custom drivers', (assert) => {
    class Ses implements Mailable {
      public send () {}
    }

    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = false
      protected getDefaultDriver () {
        return 'smtp'
      }
    }

    const mail = new Mail({})

    mail.extend('ses', () => {
      return new Ses()
    })

    const driver = mail.driver('ses')
    assert.instanceOf(driver, Ses)
  })

  test('save drivers to cache when enabled', (assert) => {
    class Smtp implements Mailable {
      public name: Symbol

      constructor () {
        this.name = Symbol('smtp')
      }

      public send () {}
    }

    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = true
      protected getDefaultDriver () {
        return 'smtp'
      }

      public createSmtp () {
        return new Smtp()
      }
    }

    const mail = new Mail({})
    const driver = mail.driver('smtp')
    const driver1 = mail.driver('smtp')
    assert.deepEqual(driver, driver1)
  })

  test('save extended drivers to cache when enabled', (assert) => {
    class Ses implements Mailable {
      public name: Symbol

      constructor () {
        this.name = Symbol('smtp')
      }

      public send () {}
    }

    class Mail extends Manager<Mailable> {
      protected $cacheDrivers = true
      protected getDefaultDriver () {
        return 'smtp'
      }
    }

    const mail = new Mail({})

    mail.extend('ses', () => {
      return new Ses()
    })

    const driver = mail.driver('ses')
    const driver1 = mail.driver('ses')
    assert.deepEqual(driver, driver1)
  })
})
