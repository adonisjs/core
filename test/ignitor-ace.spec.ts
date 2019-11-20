// test.group('Ignitor | Ace', (group) => {
//   group.after(async () => {
//     await fs.cleanup()
//   })

//   group.beforeEach(() => {
//     process.env.NODE_ENV = 'testing'
//   })

//   group.afterEach(async () => {
//     delete process.env.NODE_ENV
//     await fs.cleanup()
//   })

//   test('do not bootstrap application when running ace command', async (assert) => {
//     process.env.TS_NODE = 'true'

//     const ignitor = new Ignitor(fs.basePath)
//     await fs.add('ace-manifest.json', JSON.stringify({
//       foo: {
//         commandName: 'foo',
//         commandPath: './fooCommand',
//       },
//     }))

//     await fs.add('fooCommand.ts', `export default class FooCommand {
//       public static args = []
//       public static flags = []

//       public static $boot () {
//       }

//       public handle () {
//       }
//     }`)

//     await ignitor.handleAceCommand(['foo'])
//     assert.isFalse(ignitor.bootstraped)
//   })

//   test('bootstrap application when loadApp setting is true', async (assert) => {
//     const ignitor = new Ignitor(fs.basePath)
//     await fs.add('ace-manifest.json', JSON.stringify({
//       foo: {
//         commandName: 'foo',
//         commandPath: './foo.ts',
//         settings: {
//           loadApp: true,
//         },
//       },
//     }))

//     await fs.add('foo.ts', `export default class Foo {
//       public static args = []
//       public static flags = []

//       public static $boot () {
//       }

//       public handle () {
//       }
//     }`)

//     await fs.fsExtra.ensureDir(join(fs.basePath, 'config'))

//     await fs.add(`start/app.ts`, `export const providers = [
//       '${join(__dirname, '../providers/AppProvider.ts')}'
//     ]`)

//     await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)
//     await fs.add('.adonisrc.json', JSON.stringify({
//       autoloads: {
//         'App': './app',
//       },
//     }))

//     await ignitor.handleAceCommand(['foo'])
//     assert.isTrue(ignitor.bootstraped)
//   })

//   test('generate manifest file', async (assert) => {
//     await fs.add('commands/Foo.ts', `
//       export default class Foo {
//         public static commandName = 'foo'
//         public static description = 'Print foo'

//         public static args = []
//         public static flags = []

//         public static $boot () {
//         }

//         public handle () {
//         }
//       }
//     `)

//     await fs.add(`start/app.ts`, `export const providers = [
//       '${join(__dirname, '../providers/AppProvider.ts')}',
//     ]`)

//     await fs.add(`config/app.ts`, `export const appKey = '${SECRET}'`)
//     await fs.add('.adonisrc.json', JSON.stringify({
//       autoloads: {
//         'App': './app',
//       },
//       commands: ['./commands/Foo'],
//     }))

//     const ignitor = new Ignitor(fs.basePath)
//     await ignitor.handleAceCommand(['generate:manifest'])
//     assert.isTrue(ignitor.bootstraped)

//     const manifestFile = await fs.get('ace-manifest.json')
//     assert.deepEqual(JSON.parse(manifestFile), {
//       foo: {
//         settings: {},
//         commandPath: './commands/Foo',
//         commandName: 'foo',
//         description: 'Print foo',
//         args: [],
//         flags: [],
//       },
//     })
//   })
// })
