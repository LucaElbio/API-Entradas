import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    try {
      await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

      // Log successful authentication
      ctx.logger.info('User authenticated successfully', {
        userId: ctx.auth.user?.id,
        email: ctx.auth.user?.email,
        route: ctx.request.url(),
        method: ctx.request.method(),
        ip: ctx.request.ip(),
      })

      return next()
    } catch (error) {
      // Log failed authentication attempts
      ctx.logger.warn('Authentication failed', {
        route: ctx.request.url(),
        method: ctx.request.method(),
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
        timestamp: new Date().toISOString(),
        error: error.message,
      })

      // Return consistent JSON error response for API
      return ctx.response.status(401).json({
        message: 'No autorizado. Se requiere autenticación válida.',
        error: 'UNAUTHORIZED',
      })
    }
  }
}
