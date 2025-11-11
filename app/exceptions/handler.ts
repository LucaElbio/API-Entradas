import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const { request, response, logger } = ctx

    /**
     * Handle VineJS validation errors
     */
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      logger.warn('Validation error occurred', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        errors: error.messages,
        timestamp: new Date().toISOString(),
      })

      return response.status(400).json({
        message: 'Error de validación',
        errors: error.messages,
        error: 'VALIDATION_ERROR',
      })
    }

    /**
     * Handle authentication errors
     */
    if (error instanceof Error && error.message.includes('E_INVALID_CREDENTIALS')) {
      logger.warn('Invalid credentials attempt', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        timestamp: new Date().toISOString(),
      })

      return response.status(401).json({
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS',
      })
    }

    /**
     * Handle unauthorized access
     */
    if (error instanceof Error && error.message.includes('E_UNAUTHORIZED_ACCESS')) {
      logger.warn('Unauthorized access attempt', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        timestamp: new Date().toISOString(),
      })

      return response.status(401).json({
        message: 'No autorizado. Se requiere autenticación válida.',
        error: 'UNAUTHORIZED',
      })
    }

    /**
     * Handle route not found errors
     */
    if (error instanceof Error && error.message.includes('E_ROUTE_NOT_FOUND')) {
      logger.warn('Route not found', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        timestamp: new Date().toISOString(),
      })

      return response.status(404).json({
        message: `Cannot ${request.method()}:${request.url()}`,
        error: 'ROUTE_NOT_FOUND',
      })
    }

    /**
     * Handle database connection errors
     */
    if (
      error instanceof Error &&
      (error.message.includes('ECONNREFUSED') || error.message.includes('connection'))
    ) {
      logger.error('Database connection error', {
        url: request.url(),
        method: request.method(),
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.status(503).json({
        message: 'Servicio temporalmente no disponible. Intente nuevamente.',
        error: 'SERVICE_UNAVAILABLE',
      })
    }

    /**
     * Handle generic server errors
     */
    if (error instanceof Error) {
      logger.error('Unhandled server error', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        error: error.message,
        // stack: this.debug ? error.stack : undefined,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })

      return response.status(500).json({
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR',
        // ...(this.debug && { details: error.message }),
        details: error.message,
      })
    }

    // Fallback to parent handler for other types of errors
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    const { request, logger } = ctx

    // Log all errors for monitoring and debugging
    if (error instanceof Error) {
      logger.error('Error reported to monitoring', {
        url: request.url(),
        method: request.method(),
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    }

    return super.report(error, ctx)
  }
}
