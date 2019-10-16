/*
* @adonisjs/core
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import findPkg from 'find-package-json'
import { Server as HttpsServer } from 'https'
import { Ioc, Registrar } from '@adonisjs/fold'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { esmRequire, Exception } from '@poppinss/utils'
import { ServerContract } from '@ioc:Adonis/Core/Server'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Application } from '@adonisjs/application/build/standalone'
import { IncomingMessage, ServerResponse, Server, createServer } from 'http'

type ServerHandler = (req: IncomingMessage, res: ServerResponse) => any
type CustomServerCallback = (handler: ServerHandler) => Server | HttpsServer

/**
 * Ignitor is used to wireup different pieces of AdonisJs to bootstrap
 * the application.
 */
export class Ignitor {
  /**
   * Reference to provider class instances. We need to keep
   * a reference to execute lifecycle hooks during the
   * startup process.
   */
  private _providersList: any[] = []

  /**
   * An array of provider instances, that has `onExit` hook. We
   * need a reference of those providers through out the
   * app lifecycle, so that we call `onExit` hook when
   * server stops.
   */
  private _providersWithExitHook: any[] = []

  /**
   * The registrar to register and boot providers
   */
  private _registrar: Registrar

  /**
   * Reference to the application instance
   */
  public application: ApplicationContract

  /**
   * Tracking if application has already been bootstrapped
   * or not.
   */
  public bootstraped: boolean = false

  constructor (private _appRoot: string) {
    const ioc = new Ioc()

    /**
     * Adding IoC container resolver methods to the globals.
     */
    global[Symbol.for('ioc.use')] = ioc.use.bind(ioc)
    global[Symbol.for('ioc.make')] = ioc.make.bind(ioc)
    global[Symbol.for('ioc.call')] = ioc.call.bind(ioc)

    /**
     * The package file is required to read the version of `@adonisjs/core`
     * package and set that as the application version
     */
    const nearestDir = join(__dirname, '..', '..')
    const pkg = findPkg(nearestDir).next().value

    /**
     * The contents of the rc file
     */
    const rcContents = this._require(join(this._appRoot, '.adonisrc.json'), true) || {}

    /**
     * Setting up the application and binding it to the container as well. This makes
     * it's way to the container even before the providers starts registering
     * themselves.
     */
    this.application = new Application(this._appRoot, ioc, rcContents, pkg)
    ioc.singleton('Adonis/Core/Application', () => this.application)
  }

  /**
   * Require a module and optionally ignore error if file is missing
   */
  private _require (filePath: string, optional = false): any | null {
    try {
      return esmRequire(filePath)
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].indexOf(error.code) > -1 && optional) {
        return null
      }

      throw error
    }
  }

  /**
   * Returns `providers` and `aliases` from the app file.
   */
  private _requireAppFile (): {
    providers: string[],
    commands: string[],
    aliases: { [key: string]: string },
  } {
    const appExports = require(this.application.startPath('app'))

    /**
     * Validate the required props to ensure they exists
     */
    const requiredExports = ['providers']
    requiredExports.forEach((prop) => {
      if (!appExports[prop]) {
        throw new Exception(
          `export \`${prop}\` from \`${this.application.directoriesMap.get('start')}/app\` file`,
          500,
          'E_MISSING_APP_ESSENTIALS',
        )
      }
    })

    return {
      providers: appExports.providers,
      aliases: appExports.aliases || {},
      commands: appExports.commands || [],
    }
  }

  /**
   * Registers all the providers with the IoC container
   */
  private _registerProviders () {
    this._registrar = new Registrar(this.application.container)

    /**
     * Loads `start/app` file and use providers and aliases from it. In
     * case of `intent === ace`, also use `aceProviders`.
     */
    const { providers, aliases } = this._requireAppFile()

    /**
     * Register all providers
     */
    this._providersList = this._registrar.useProviders(providers).register()

    /**
     * We need to persist the providers with `exit` hook, so that we can
     * call them, when application goes down.
     */
    this._providersWithExitHook = this._providersList.filter((provider) => {
      return typeof (provider.shutdown) === 'function'
    })

    /**
     * Register aliases after registering providers. This will override
     * the aliases defined by the providers, since user defined aliases
     * are given more preference.
     */
    Object.keys(aliases).forEach((alias) => {
      this.application.container.alias(aliases[alias], alias)
    })
  }

  /**
   * Register autoloads
   */
  private _registerAutoloads () {
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')

    this.application.autoloadsMap.forEach((toPath, alias) => {
      logger.trace('autoloading %s to %s namespace', toPath, alias)
      this.application.container.autoload(join(this.application.appRoot, toPath), alias)
    })
  }

  /**
   * Preloads all files defined inside `.adonisrc.json` file.
   */
  private _preloadFiles () {
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')

    this.application.preloads
      .filter((node) => {
        if (!node.environment) {
          return true
        }

        if (this.application.environment === 'unknown') {
          return true
        }

        return node.environment.indexOf(this.application.environment) > -1
      })
      .forEach((node) => {
        logger.trace('preloading %s', node.file)
        this._require(join(this.application.appRoot, node.file), node.optional)
      })
  }

  /**
   * Binds exception handler when it's namespace is
   * defined
   */
  private _bindExceptionHandler (server: ServerContract) {
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')
    logger.trace('binding %s exception handler', this.application.exceptionHandlerNamespace)

    /**
     * Attaching a custom callback to the server to forward
     * errors to the App exception handler
     */
    server.errorHandler(this.application.exceptionHandlerNamespace)
  }

  /**
   * Start the HTTP server by pulling it from the IoC container
   */
  private async _createHttpServer (serverCallback?: CustomServerCallback) {
    const server = this.application.container.use('Adonis/Core/Server')
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')

    /**
     * Optimize server to cache handler
     */
    server.optimize()
    logger.trace('optimizing http server handlers')

    /**
     * Handled exceptions during the HTTP request/response
     * lifecycle
     */
    this._bindExceptionHandler(server)

    /**
     * Finally start the HTTP server and keep reference to
     * it
     */
    const handler = server.handle.bind(server)

    /**
     * Set Http or Https server as an instance on Adonis server
     */
    server.instance = serverCallback ? serverCallback(handler) : createServer(handler)
  }

  /**
   * Executes the ready hooks when the application is ready. In case of HTTP server
   * it is called just before calling the `listen` method.
   */
  private async _executeReadyHooks () {
    /**
     * Pull providers with HTTP server hook
     */
    const providersWithHttpHook = this._providersList.filter((provider) => {
      return typeof (provider.ready) === 'function'
    })

    /**
     * Execute hooks
     */
    await Promise.all(providersWithHttpHook.map((provider) => provider.ready()))
  }

  /**
   * Loads ts node. Wrapped in try/catch, so that we can give informative
   * error when module is missing.
   */
  private _loadTsNode () {
    try {
      return require('ts-node')
    } catch (error) {
      if (['MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) {
        throw new Exception('ts-node must be installed to execute ace commands')
      }
      throw error
    }
  }

  /**
   * Generates the manifest file for
   */
  private async _generateManifest (manifest) {
    await this.bootstrap(true)
    let { commands } = this._requireAppFile()

    /**
     * Loop over all the providers and register commands
     */
    this._providersList.forEach((provider) => {
      if (provider.commands) {
        commands = commands.concat(provider.commands)
      }
    })

    await manifest.generate(commands)
  }

  /**
   * Executes the ace command and optionally boots the app when instructed
   */
  private async _executeAceCommand (argv: string[]) {
    const { Kernel, handleError, Manifest } = require('@adonisjs/ace')
    const manifest = new Manifest(this._appRoot)

    /**
     * We always bootstrap the app when generating manifest, since it will
     * load all the commands
     */
    if (argv[0] === 'generate:manifest') {
      await this._generateManifest(manifest)
      return
    }

    const kernel = new Kernel()
    kernel.useManifest(manifest)

    if (!argv.length) {
      kernel.printHelp()
      process.exit(0)
    }

    /**
     * Printing the help screen
     */
    kernel.flag('help', (value, _options, command) => {
      if (!value) {
        return
      }

      kernel.printHelp(command)
      process.exit(0)
    }, {})

    /**
     * Only bootstrapping the application when command sets `loadApp` to true
     */
    kernel.before('find', async (command) => {
      if (command && command.settings && command.settings.loadApp) {
        await this.bootstrap(false)
      }
    })

    try {
      await kernel.handle(argv)
    } catch (error) {
      handleError(error)
    }
  }

  /**
   * Attach http server to a given port and host by picking it from
   * the `environment` variables.
   */
  private _listen () {
    return new Promise((resolve, reject) => {
      const Env = this.application.container.use('Adonis/Core/Env')
      const Logger = this.application.container.use('Adonis/Core/Logger')
      const Server = this.application.container.use('Adonis/Core/Server')
      const host = Env.get('HOST', '0.0.0.0') as string
      const port = Number(Env.get('PORT', '3333') as string)

      /**
       * The hooks must be executed before we start accepting new requests, since
       * the hooks may construct some state required by the HTTP server.
       */
      this
        ._executeReadyHooks()
        .then(() => {
          Server.instance!.listen(port, host, () => {
            this.application.isReady = true
            Logger.info('started server on %s:%s', host, port)
            resolve()
          })
        })
        .catch(reject)
    })
  }

  /**
   * Closes HTTP server and then executes all `onExit` hooks
   * before exiting the process.
   *
   * The HTTP is closed first, so that other unavailable resources
   * will not impact existing requests.
   */
  private async _prepareShutDown () {
    const Server = this.application.container.use('Adonis/Core/Server')
    const logger = this.application.container.use<LoggerContract>('Adonis/Core/Logger')
    this.application.isShuttingDown = true

    /**
     * Close the HTTP server when it exists.
     */
    if (Server.instance) {
      Server.instance.close()
    }

    logger.trace('preparing server shutdown')
    await Promise.all(this._providersWithExitHook.map((provider: any) => provider.shutdown()))
  }

  /**
   * Bind listeners for `SIGINT` and `SIGTERM` signals. The `SIGINT`
   * signal is only handled when process is started using pm2.
   */
  private _listenForExitEvents () {
    /**
     * Only when starting using pm2, otherwise only `Ctrl+C` sends
     * SIGINT signal, which doesn't need graceful exit.
     */
    if (process.env.pm_id) {
      process.on('SIGINT', async () => {
        try {
          await this._prepareShutDown()
          process.exit(0)
        } catch (error) {
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', async () => {
      try {
        await this._prepareShutDown()
        process.exit(0)
      } catch (error) {
        process.exit(1)
      }
    })
  }

  /**
   * Monitors HTTP server for by attaching `onClose` and `onError`
   * listeners
   */
  private _monitorHttpServer () {
    /**
     * Listen for HTTP server error when the server instance exists. We consider
     * server error as an exit event as well.
     */
    const Server = this.application.container.use('Adonis/Core/Server')
    if (!Server.instance) {
      return
    }

    Server.instance.on('close', () => {
      this.application.isReady = false
    })

    Server.instance.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        Server.instance.close()
        return
      }

      /**
       * Attempt to gracefully shutdown the server or kill it after
       * 3 seconds at max
       */
      this.kill(3000)
    })
  }

  /**
   * Pretty prints the error on terminal
   */
  private async _prettyPrintError (error: any) {
    const Youch = require('youch')
    const output = await new Youch(error, {}).toJSON()
    console.log(require('youch-terminal')(output))
  }

  /**
   * Bootstrap the application by register and booting all
   * providers, setting up autoloads and preloading files.
   */
  public async bootstrap (deferBootingProviders: boolean = false) {
    if (this.bootstraped) {
      return
    }

    this.bootstraped = true
    this._registerProviders()

    /**
     * Boot providers when not deferring the boot process
     */
    if (!deferBootingProviders) {
      await this.bootProviders()
    }

    this._registerAutoloads()
    this._preloadFiles()
  }

  /**
   * Register and boot all application providers. Also defines the aliases
   * for IoC container bindings.
   */
  public async bootProviders () {
    /**
     * Finally boot providers, which is an async process.
     */
    await this._registrar.boot()
  }

  /**
   * Register ts node with appropriate hoosk when runtime is typescript
   */
  public registerTsNode () {
    if (!this.application.typescript) {
      return
    }

    const { iocTransformer } = require('@adonisjs/ioc-transformer')
    this._loadTsNode().register({
      files: true,
      transformers: {
        after: [
          iocTransformer(require('typescript/lib/typescript'), this.application.rcFile),
        ],
      },
    })
  }

  /**
   * Bootstrap the application and start HTTP server to accept
   * new connections.
   */
  public async startHttpServer (
    serverCallback?: CustomServerCallback,
    deferBootingProviders: boolean = false,
  ) {
    this.application.environment = 'web'

    try {
      await this.bootstrap(deferBootingProviders)
      await this._createHttpServer(serverCallback)
      await this._listen()
      this._monitorHttpServer()
      this._listenForExitEvents()
    } catch (error) {
      if (this.application.inDev) {
        this._prettyPrintError(error).finally(() => process.exit(1))
      } else {
        console.error(error.stack)
        process.exit(1)
      }
    }
  }

  /**
   * Starts the process by listening for ace commands
   */
  public async handleAceCommand (argv: string[]) {
    this.application.environment = 'console'

    try {
      await this._executeAceCommand(argv)
      this._listenForExitEvents()
    } catch (error) {
      if (this.application.inDev) {
        this._prettyPrintError(error).finally(() => process.exit(1))
      } else {
        console.error(error.stack)
        process.exit(1)
      }
    }
  }

  /**
   * Closes the ignitor process. This will perform a graceful
   * shutdown.
   */
  public async close () {
    await this._prepareShutDown()
  }

  /**
   * Kills the ignitor process by attempting to perform a graceful
   * shutdown or killing the app forcefully as waiting for configured
   * seconds.
   */
  public async kill (waitTimeout: number = 3000) {
    try {
      await Promise.race([this._prepareShutDown(), new Promise((resolve) => {
        setTimeout(resolve, waitTimeout)
      })])
      process.exit(0)
    } catch (error) {
      process.exit(1)
    }
  }
}
