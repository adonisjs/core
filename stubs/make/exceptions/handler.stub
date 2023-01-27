import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = true

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }
}
