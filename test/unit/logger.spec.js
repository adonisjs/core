'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')
const fs = require('fs-extra')
const { ioc } = require('@adonisjs/fold')
const stdout = require('test-console').stdout
const stderr = require('test-console').stderr
const { Config, Helpers } = require('@adonisjs/sink')

const FileDriver = require('../../src/Logger/Drivers').file
const ConsoleDriver = require('../../src/Logger/Drivers').console
const Logger = require('../../src/Logger')
const LoggerManager = require('../../src/Logger/Manager')
const LoggerFacade = require('../../src/Logger/Facade')

const sysLog = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
}

test.group('Logger | File Driver', (group) => {
  group.beforeEach(() => {
    this.helpers = new Helpers(path.join(__dirname))
  })

  group.before((done) => {
    fs.ensureDir(path.join(__dirname, 'tmp'), done)
  })

  group.after((done) => {
    if (process.platform === 'win32') {
      return done()
    }
    fs.remove(path.join(__dirname, 'tmp'), done)
  })

  test('initiate logger with correct settings', (assert) => {
    const fileDriver = new FileDriver(this.helpers)
    fileDriver.setConfig({})

    assert.deepEqual(fileDriver.logger.levels, sysLog)
    assert.equal(fileDriver.logger.transports['adonis-app'].dirname, path.join(__dirname, 'tmp'))
  })

  test('do not override filename when it is absolute path', (assert) => {
    const fileDriver = new FileDriver(this.helpers)

    fileDriver.setConfig({
      filename: path.join(__dirname, 'my.log')
    })

    assert.equal(fileDriver.config.filename, path.join(__dirname, 'my.log'))
  })

  test('log info to the file', (assert, done) => {
    const fileDriver = new FileDriver(this.helpers)
    fileDriver.setConfig({})

    fileDriver.log(6, 'hello', () => {
      fs.readFile(fileDriver.config.filename, (error, contents) => {
        if (error) {
          return done(error)
        }
        contents = JSON.parse(contents)
        assert.equal(contents.message, 'hello')
        assert.equal(contents.level, 'info')
        done()
      })
    })
  }).timeout(3000)

  test('return active log level', (assert) => {
    const fileDriver = new FileDriver(this.helpers)
    fileDriver.setConfig({})

    assert.equal(fileDriver.level, 'info')
  })

  test('update log level', (assert) => {
    const fileDriver = new FileDriver(this.helpers)
    fileDriver.setConfig({})

    fileDriver.level = 'debug'
    assert.equal(fileDriver.level, 'debug')
  })
})

test.group('Logger | Console Driver', () => {
  test('initiate logger with correct settings', (assert) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    assert.deepEqual(consoleDriver.logger.levels, sysLog)
  })

  test('log info to the console', (assert, done) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const inspect = stdout.inspect()

    consoleDriver.log(6, 'hello', () => {
      inspect.restore()
      assert.include(inspect.output[0], 'hello')
      done()
    })
  }).timeout(3000)

  test('return active log level', (assert) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    assert.equal(consoleDriver.level, 'info')
  })

  test('update log level', (assert) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    consoleDriver.level = 'debug'
    assert.equal(consoleDriver.level, 'debug')
  })
})

test.group('Logger | Instance', (group) => {
  test('log info using defined driver', (assert, done) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const logger = new Logger(consoleDriver)
    const inspect = stdout.inspect()
    logger.info('hello', () => {
      inspect.restore()
      assert.include(inspect.output[0], 'info')
      done()
    })
  })

  test('log warning using defined driver', (assert) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const logger = new Logger(consoleDriver)
    const inspect = stdout.inspect()
    logger.warning('hello')
    inspect.restore()
    assert.include(inspect.output[0], 'warning')
  })

  test('do not log level before the level defined on the driver', (assert, done) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const logger = new Logger(consoleDriver)
    const inspect = stderr.inspect()
    logger.debug('hello', () => {
      inspect.restore()
      assert.lengthOf(inspect.output, 0)
      done()
    })
  })

  test('update log level', (assert, done) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const logger = new Logger(consoleDriver)
    logger.level = 'debug'
    const inspect = stderr.inspect()

    logger.debug('hello', () => {
      inspect.restore()
      assert.include(inspect.output[0], 'debug')
      done()
    })
  })

  test('get current log level', (assert) => {
    const consoleDriver = new ConsoleDriver()
    consoleDriver.setConfig({})

    const logger = new Logger(consoleDriver)
    assert.equal(logger.level, 'info')
  })
})

test.group('Logger | Manager', (group) => {
  group.before(() => {
    ioc.fake('Adonis/Src/Config', () => new Config())
    ioc.fake('Adonis/Src/Helpers', () => new Helpers(path.join(__dirname)))
  })

  test('extend logger by adding drivers', (assert) => {
    const myDriver = {}
    LoggerManager.extend('myDriver', myDriver)
    assert.deepEqual(LoggerManager._drivers, { myDriver })
  })

  test('throw error when trying to access invalid driver', (assert) => {
    const fn = () => LoggerManager.driver('foo')
    assert.throw(fn, 'E_INVALID_LOGGER_DRIVER: Logger driver foo does not exists')
  })

  test('return driver instance for a given driver', (assert) => {
    const consoleDriver = LoggerManager.driver('console')
    assert.instanceOf(consoleDriver, ConsoleDriver)
  })
})

test.group('Logger | Facade', (group) => {
  group.before(() => {
    ioc.fake('Adonis/Src/Config', () => new Config())
    ioc.fake('Adonis/Src/Helpers', () => new Helpers(path.join(__dirname)))
  })

  test('return logger instance with selected driver', (assert) => {
    const config = new Config()
    config.set('app.logger.file', {
      driver: 'file'
    })

    const logger = new LoggerFacade(config)
    assert.instanceOf(logger.transport('file'), Logger)
    assert.instanceOf(logger.transport('file').driver, FileDriver)
  })

  test('return logger instance with extended driver', (assert) => {
    const myDriver = {
      setConfig () {}
    }
    LoggerManager.extend('mydriver', myDriver)

    const config = new Config()
    config.set('app.logger.mydriver', {
      driver: 'mydriver'
    })

    const logger = new LoggerFacade(config)
    assert.instanceOf(logger.transport('mydriver'), Logger)
    assert.deepEqual(logger.transport('mydriver').driver, myDriver)
  })

  test('create singleton logger instances', (assert) => {
    const config = new Config()
    config.set('app.logger.file', {
      driver: 'file'
    })

    const logger = new LoggerFacade(config)
    logger.transport('file')
    assert.lengthOf(Object.keys(logger._loggerInstances), 1)
    logger.transport('file')
    assert.lengthOf(Object.keys(logger._loggerInstances), 1)
  })

  test('create different instance when transport is different', (assert) => {
    const config = new Config()
    config.set('app.logger.file', {
      driver: 'file'
    })

    config.set('app.logger.anotherFile', {
      driver: 'file'
    })

    const logger = new LoggerFacade(config)
    logger.transport('file')
    assert.lengthOf(Object.keys(logger._loggerInstances), 1)
    logger.transport('anotherFile')
    assert.lengthOf(Object.keys(logger._loggerInstances), 2)
  })

  test('proxy logger instance methods', (assert, done) => {
    const config = new Config()
    config.set('app.logger', {
      transport: 'console',
      console: {
        driver: 'console'
      }
    })

    const logger = new LoggerFacade(config)
    const inspect = stdout.inspect()

    logger.info('hello', () => {
      inspect.restore()
      assert.include(inspect.output[0], 'hello')
      done()
    })
  })

  test('throw exception when driver is invalid', (assert) => {
    const config = new Config()
    config.set('app.logger', {
      transport: 'console',

      console: {
        driver: 'foo'
      }
    })

    const logger = new LoggerFacade(config)
    const fn = () => logger.debug('')
    assert.throw(fn, 'E_INVALID_LOGGER_DRIVER: Logger driver foo does not exists')
  })

  test('use console transport when no transport is defined', (assert, done) => {
    const config = new Config()
    config.set('app.logger', {
    })

    const logger = new LoggerFacade(config)
    const inspect = stdout.inspect()

    logger.info('hello', () => {
      inspect.restore()
      assert.include(inspect.output[0], 'hello')
      done()
    })
  })
})
