import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para verificar roles de usuario
 * Basado en el ERD: ADMIN, USER, MANAGER
 */
export default class RoleMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles?: string[]
    } = {}
  ) {
    const user = ctx.auth.user
    const { roles = [] } = options

    if (!user) {
      ctx.logger.warn('Role check failed - no authenticated user', {
        route: ctx.request.url(),
        method: ctx.request.method(),
        ip: ctx.request.ip(),
        timestamp: new Date().toISOString(),
      })

      return ctx.response.status(401).json({
        message: 'Se requiere autenticación para acceder a este recurso',
        error: 'AUTHENTICATION_REQUIRED',
      })
    }

    // Si no se especifican roles, solo verificar que esté autenticado
    if (roles.length === 0) {
      return next()
    }

    try {
      // Cargar el rol del usuario si no está cargado
      if (!user.role) {
        await user.load('role')
      }

      const userRole = user.role
      if (!userRole) {
        ctx.logger.warn('Role check failed - user has no role assigned', {
          userId: user.id,
          email: user.email,
          route: ctx.request.url(),
          timestamp: new Date().toISOString(),
        })

        return ctx.response.status(403).json({
          message: 'Usuario sin rol asignado',
          error: 'NO_ROLE_ASSIGNED',
        })
      }

      // Verificar si el usuario tiene el rol requerido
      const hasRequiredRole = roles.includes(userRole.code)

      if (!hasRequiredRole) {
        ctx.logger.warn('Role check failed - insufficient permissions', {
          userId: user.id,
          email: user.email,
          userRole: userRole.code,
          requiredRoles: roles,
          route: ctx.request.url(),
          timestamp: new Date().toISOString(),
        })

        return ctx.response.status(403).json({
          message: 'Permisos insuficientes para acceder a este recurso',
          error: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: userRole.code,
        })
      }

      // Log acceso autorizado
      ctx.logger.info('Role check passed', {
        userId: user.id,
        email: user.email,
        userRole: userRole.code,
        requiredRoles: roles,
        route: ctx.request.url(),
        timestamp: new Date().toISOString(),
      })

      return next()
    } catch (error) {
      ctx.logger.error('Error during role verification', {
        userId: user.id,
        error: error.message,
        route: ctx.request.url(),
        timestamp: new Date().toISOString(),
      })

      return ctx.response.status(500).json({
        message: 'Error interno del servidor durante verificación de permisos',
        error: 'ROLE_VERIFICATION_ERROR',
      })
    }
  }

  /**
   * Helpers para roles específicos
   */
  static admin() {
    return { roles: ['ADMIN'] }
  }

  static manager() {
    return { roles: ['MANAGER', 'ADMIN'] }
  }

  static user() {
    return { roles: ['USER', 'MANAGER', 'ADMIN'] }
  }

  static adminOnly() {
    return { roles: ['ADMIN'] }
  }

  static managerOrAdmin() {
    return { roles: ['MANAGER', 'ADMIN'] }
  }

  /**
   * Verificar si el usuario pertenece a la misma compañía
   */
  static sameCompany() {
    return async (ctx: HttpContext, next: NextFn) => {
      const user = ctx.auth.user
      const requestedCompanyId = ctx.request.param('companyId') || ctx.request.input('companyId')

      if (!user) {
        return ctx.response.status(401).json({
          message: 'Se requiere autenticación',
          error: 'AUTHENTICATION_REQUIRED',
        })
      }

      // ADMIN puede acceder a cualquier compañía
      await user.load('role')
      if (user.role?.code === 'ADMIN') {
        return next()
      }

      // Otros usuarios solo pueden acceder a su propia compañía
      if (requestedCompanyId && Number.parseInt(requestedCompanyId) !== user.companyId) {
        ctx.logger.warn('Company access denied', {
          userId: user.id,
          userCompanyId: user.companyId,
          requestedCompanyId,
          timestamp: new Date().toISOString(),
        })

        return ctx.response.status(403).json({
          message: 'No tiene permisos para acceder a datos de otra compañía',
          error: 'COMPANY_ACCESS_DENIED',
        })
      }

      return next()
    }
  }
}
