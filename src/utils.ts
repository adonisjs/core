/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type typescript from 'typescript'
import type * as Assembler from '@adonisjs/assembler'
import { type RecursiveFileTree } from '@adonisjs/assembler/types'
import { type ApplicationService } from './types.ts'

/**
 * Imports the AdonisJS assembler package optionally. This function attempts
 * to import the assembler and returns undefined if it's not available,
 * making it safe to use in environments where the assembler might not be installed.
 *
 * @param app - The application service instance used for importing the assembler
 *
 * @example
 * const assembler = await importAssembler(app)
 * if (assembler) {
 *   // Use assembler functionality
 *   const generator = new assembler.IndexGenerator()
 * }
 */
export async function importAssembler(
  app: ApplicationService
): Promise<typeof Assembler | undefined> {
  try {
    return await app.import('@adonisjs/assembler')
  } catch {}
}

/**
 * Imports the TypeScript compiler package optionally. This function attempts
 * to import TypeScript and returns undefined if it's not available,
 * making it safe to use in environments where TypeScript might not be installed.
 *
 * @param app - The application service instance used for importing TypeScript
 *
 * @example
 * const ts = await importTypeScript(app)
 * if (ts) {
 *   // Use TypeScript compiler API
 *   const program = ts.createProgram(['file.ts'], {})
 *   const sourceFile = program.getSourceFile('file.ts')
 * }
 */
export async function importTypeScript(
  app: ApplicationService
): Promise<typeof typescript | undefined> {
  try {
    return await app.importDefault('typescript')
  } catch {}
}

/**
 * Outputs transformer data objects by generating TypeScript type definitions
 * for all transformers in the provided file tree. This function creates
 * InferData types for each transformer and organizes them in namespaces.
 *
 * @param transformersList - A recursive file tree containing transformer file paths
 * @param buffer - The file buffer to write the generated types to
 *
 * @example
 * const transformersList = {
 *   User: '#app/transformers/user_transformer',
 *   Auth: {
 *     Login: '#app/transformers/auth/login_transformer'
 *   }
 * }
 * await outputTransformerDataObjects(transformersList, buffer)
 * // Generates:
 * // export namespace Data {
 * //   export type User = InferData<UserTransformer>
 * //   export namespace Auth {
 * //     export type Login = InferData<AuthLoginTransformer>
 * //   }
 * // }
 */
export async function outputTransformerDataObjects(
  transformersList: RecursiveFileTree,
  buffer: Assembler.FileBuffer,
  withSharedProps: boolean
) {
  const importsBuffer = buffer.create()
  importsBuffer.write(
    `import type { InferData, InferVariants } from '@adonisjs/core/types/transformers'`
  )

  if (withSharedProps) {
    importsBuffer.write(`import type { InferSharedProps } from '@adonisjs/inertia/types'`)
  }

  buffer.writeLine(importsBuffer)
  buffer.write('export namespace Data {').indent()

  /**
   * Recursively generates namespace tree structure for transformers.
   * Creates nested namespaces for directory structures and type exports
   * for individual transformer files.
   *
   * @param input - The current level of the file tree to process
   * @param parents - Array of parent namespace names for import naming
   */
  function generateNamespaceTree(input: RecursiveFileTree, parents: string[]) {
    Object.keys(input).forEach((key) => {
      const value = input[key]
      if (typeof value === 'string') {
        const importName = `${parents.join()}${key}Transformer`
        importsBuffer.write(`import ${importName} from '${value}'`)
        buffer.write(`export type ${key} = InferData<${importName}>`)
        buffer.write(`export namespace ${key} {`).indent()
        buffer.write(`export type Variants = InferVariants<${importName}>`)
        buffer.dedent().write('}')
      } else {
        buffer.write(`export namespace ${key} {`).indent()
        generateNamespaceTree(value, [...parents, key])
        buffer.dedent().write(`}`)
      }
    })
  }

  generateNamespaceTree(transformersList, [])

  if (withSharedProps) {
    importsBuffer.write(`import type InertiaMiddleware from '#middleware/inertia_middleware'`)
    buffer.write('export type SharedProps = InferSharedProps<InertiaMiddleware>')
  }

  buffer.dedent().write('}')
}
