import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Rate limiting middleware para prevenir ataques de fuerza bruta
 * Implementa un simple rate limiting en memoria
 */
export default class RateLimitMiddleware {
  // Almacena intentos por IP
  private static attempts: Map<
    string,
    { count: number; firstAttempt: number; lastAttempt: number }
  > = new Map()

  // Configuración
  private maxAttempts = process.env.NODE_ENV === 'test' ? 50 : 5 // Más tolerante en tests
  private windowMs = 15 * 60 * 1000 // Ventana de 15 minutos
  private blockMs = process.env.NODE_ENV === 'test' ? 1 * 60 * 1000 : 30 * 60 * 1000 // Bloqueo más corto en tests

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    const now = Date.now()

    // Obtener o crear registro de intentos para esta IP
    let ipAttempts = RateLimitMiddleware.attempts.get(ip)

    if (!ipAttempts) {
      ipAttempts = { count: 0, firstAttempt: now, lastAttempt: now }
      RateLimitMiddleware.attempts.set(ip, ipAttempts)
    }

    // Limpiar intentos antiguos (fuera de la ventana)
    if (now - ipAttempts.firstAttempt > this.windowMs) {
      ipAttempts.count = 0
      ipAttempts.firstAttempt = now
    }

    // Verificar si la IP está bloqueada
    if (ipAttempts.count >= this.maxAttempts) {
      const timeSinceLastAttempt = now - ipAttempts.lastAttempt

      if (timeSinceLastAttempt < this.blockMs) {
        // Calcular tiempo restante de bloqueo
        const remainingTime = Math.ceil((this.blockMs - timeSinceLastAttempt) / 1000 / 60)

        ctx.logger.warn('Rate limit exceeded', {
          ip,
          attempts: ipAttempts.count,
          remainingTime,
          route: ctx.request.url(),
          timestamp: new Date().toISOString(),
        })

        return ctx.response.status(429).json({
          message: `Demasiados intentos de inicio de sesión. Intente nuevamente en ${remainingTime} minutos.`,
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: remainingTime,
        })
      } else {
        // Tiempo de bloqueo expirado, resetear contador
        ipAttempts.count = 0
        ipAttempts.firstAttempt = now
      }
    }

    // Incrementar contador solo para rutas de login
    if (ctx.request.url().includes('/login')) {
      ipAttempts.count++
      ipAttempts.lastAttempt = now
      RateLimitMiddleware.attempts.set(ip, ipAttempts)
    }

    return next()
  }

  /**
   * Método para limpiar intentos exitosos (llamar después de login exitoso)
   */
  static clearAttempts(ip: string) {
    RateLimitMiddleware.attempts.delete(ip)
  }

  /**
   * Método para limpiar registros antiguos (llamar periódicamente)
   */
  static cleanupOldAttempts() {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000

    for (const [ip, attempts] of RateLimitMiddleware.attempts.entries()) {
      if (now - attempts.firstAttempt > windowMs) {
        RateLimitMiddleware.attempts.delete(ip)
      }
    }
  }
}
