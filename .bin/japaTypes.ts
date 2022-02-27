import { Assert } from '@japa/assert'

declare module '@japa/runner' {
  interface TestContext {
    assert: Assert
  }
}
