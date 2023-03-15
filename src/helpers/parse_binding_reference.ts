/*
 * @adonisjs/core
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import parseImports from 'parse-imports'
import { LazyImport, Constructor } from '../../types/http.js'

/**
 * The "parseBindingReference" method can be used to parse a binding references
 * similar to route controller binding value or event listener binding value.
 *
 * See the following examples to understand how this function works.
 *
 * ### Magic strings
 * ```ts
 * parseBindingReference('#controllers/home_controller')
 * // returns { moduleNameOrPath: '#controllers/home_controller', method: 'handle' }

 * parseBindingReference('#controllers/home_controller.index')
 * // returns { moduleNameOrPath: '#controllers/home_controller', method: 'index' }

 * parseBindingReference('#controllers/home.controller.index')
 * // returns { moduleNameOrPath: '#controllers/home.controller', method: 'index' }
 * ```
 *
 * ### Class reference
 * ```ts
 * class HomeController {}
 *
 * parseBindingReference([HomeController])
 * // returns { moduleNameOrPath: 'HomeController', method: 'handle' }

 * parseBindingReference([HomeController, 'index'])
 * // returns { moduleNameOrPath: 'HomeController', method: 'index' }
 * ```
 *
 * ### Lazy import reference
 * ```ts
 * const HomeController = () => import('#controllers/home_controller')
 *
 * parseBindingReference([HomeController])
 * // returns { moduleNameOrPath: '#controllers/home_controller', method: 'handle' }

 * parseBindingReference([HomeController, 'index'])
 * // returns { moduleNameOrPath: 'controllers/home_controller', method: 'index' }
 * ```
 */
export async function parseBindingReference(
  binding: string | [LazyImport<Constructor<any>> | Constructor<any>, any?]
): Promise<{ moduleNameOrPath: string; method: string }> {
  /**
   * The binding reference is a magic string. It might not have method
   * name attached to it. Therefore we split the string and attempt
   * to find the method or use the default method name "handle".
   */
  if (typeof binding === 'string') {
    const tokens = binding.split('.')
    if (tokens.length === 1) {
      return { moduleNameOrPath: binding, method: 'handle' }
    }
    return { method: tokens.pop()!, moduleNameOrPath: tokens.join('.') }
  }

  const [bindingReference, method] = binding

  /**
   * Parsing the binding reference for dynamic imports and using its
   * import value.
   */
  const imports = [...(await parseImports(bindingReference.toString()))]
  const importedModule = imports.find(
    ($import) => $import.isDynamicImport && $import.moduleSpecifier.value
  )
  if (importedModule) {
    return {
      moduleNameOrPath: importedModule.moduleSpecifier.value!,
      method: method || 'handle',
    }
  }

  /**
   * Otherwise using the name of the binding reference.
   */
  return {
    moduleNameOrPath: bindingReference.name,
    method: method || 'handle',
  }
}
