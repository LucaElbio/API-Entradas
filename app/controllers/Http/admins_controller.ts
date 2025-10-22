import User from '#models/user'
import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'
import { registerAdminValidator, loginAdminValidator } from '#validators/admin_validator'
import { DateTime } from 'luxon'

export default class AdminsController {
  /**
   * POST /admin/register
   * Registro de administrador
   * 
   * Criterios de aceptación:
   * - El formulario de registro debe incluir nombre, apellido, email y contraseña
   * - Validar que el email no esté registrado previamente
   * - La contraseña debe tener mínimo 8 caracteres, con al menos una mayúscula y un número
   * - Mostrar mensaje de error si los datos son inválidos
   */
  public async register({ request, response, logger }: HttpContext) {
    const clientIp = request.ip()

    try {
      // Validar datos del request
      const data = await registerAdminValidator.validate(request.all())

      // Buscar el rol de administrador
      const adminRole = await Role.findBy('code', 'ADMIN')
      if (!adminRole) {
        logger.error('Admin role not found in database', {
          timestamp: new Date().toISOString(),
        })
        return response.internalServerError({
          message: 'Error: Rol de administrador no encontrado en el sistema',
        })
      }

      // Log intento de registro de administrador
      logger.info('Admin registration attempt', {
        email: data.email,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      })

      // Crear usuario administrador
      const admin = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        dni: data.dni || '',
        password: data.password,
        companyId: data.companyId || 1,
        roleId: adminRole.id, // Asignar rol de administrador
      })

      // Log registro exitoso
      logger.info('Admin registered successfully', {
        userId: admin.id,
        email: admin.email,
        roleId: admin.roleId,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      })

      return response.created({
        message: 'Administrador registrado exitosamente',
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          dni: admin.dni,
          companyId: admin.companyId,
          roleId: admin.roleId,
          createdAt: admin.createdAt,
        },
      })
    } catch (error) {
      // Log error de registro
      logger.error('Admin registration failed', {
        email: request.input('email'),
        ip: clientIp,
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      if (error.messages) {
        return response.badRequest({
          message: 'Error de validación',
          errors: error.messages,
        })
      }

      console.error('Error registering admin:', error)
      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * POST /admin/login
   * Inicio de sesión de administrador (JWT)
   * 
   * Criterios de aceptación:
   * - Al iniciar sesión, si las credenciales son correctas, acceder al panel de administrador
   * - Mostrar mensaje de error si los datos son inválidos
   */
  public async login({ request, response, logger }: HttpContext) {
    const clientIp = request.ip()
    const userAgent = request.header('user-agent')
    const email = request.input('email', '').toLowerCase()

    try {
      const { email: validatedEmail, password } = await loginAdminValidator.validate(
        request.body()
      )

      // Log intento de login
      logger.info('Admin login attempt', {
        email: validatedEmail,
        ip: clientIp,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
      })

      // Verificar credenciales
      const user = await User.verifyCredentials(validatedEmail, password)

      // Verificar que el usuario tenga rol de administrador
      const adminRole = await Role.findBy('code', 'ADMIN')
      if (!adminRole || user.roleId !== adminRole.id) {
        logger.warn('Non-admin user attempted admin login', {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          ip: clientIp,
          timestamp: new Date().toISOString(),
        })
        return response.forbidden({
          message: 'Acceso denegado. Se requieren permisos de administrador',
        })
      }

      // Crear token de acceso con expiración de 24 horas
      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '24 hours',
      })

      // Log login exitoso
      logger.info('Admin login successful', {
        userId: user.id,
        email: user.email,
        ip: clientIp,
        tokenId: token.identifier,
        timestamp: new Date().toISOString(),
      })

      return response.ok({
        message: 'Inicio de sesión exitoso',
        token: token.value!.release(),
        expiresAt: DateTime.now().plus({ hours: 24 }).toISO(),
        admin: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dni: user.dni,
          companyId: user.companyId,
          roleId: user.roleId,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      // Log intento de login fallido
      logger.warn('Admin login failed', {
        email: email,
        ip: clientIp,
        userAgent: userAgent,
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      if (error.messages) {
        return response.badRequest({
          message: 'Error de validación',
          errors: error.messages,
        })
      }

      // Cualquier error en verifyCredentials se trata como credenciales inválidas
      return response.badRequest({
        message: 'Credenciales inválidas',
      })
    }
  }

  /**
   * GET /admin/me
   * Obtener perfil del administrador autenticado
   */
  public async me({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user!

      // Verificar que el usuario tenga rol de administrador
      const adminRole = await Role.findBy('code', 'ADMIN')
      if (!adminRole || user.roleId !== adminRole.id) {
        return response.forbidden({
          message: 'Acceso denegado. Se requieren permisos de administrador',
        })
      }

      // Log acceso a perfil
      logger.info('Admin profile accessed', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      })

      return response.ok({
        admin: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dni: user.dni,
          companyId: user.companyId,
          roleId: user.roleId,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      logger.error('Error getting admin profile', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * POST /admin/logout
   * Cerrar sesión de administrador
   */
  public async logout({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user
      const token = user?.currentAccessToken

      if (user && token) {
        // Verificar que el usuario tenga rol de administrador
        const adminRole = await Role.findBy('code', 'ADMIN')
        if (!adminRole || user.roleId !== adminRole.id) {
          return response.forbidden({
            message: 'Acceso denegado. Se requieren permisos de administrador',
          })
        }

        await User.accessTokens.delete(user, token.identifier)

        // Log logout exitoso
        logger.info('Admin logout successful', {
          userId: user.id,
          email: user.email,
          tokenId: token.identifier,
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        message: 'Sesión cerrada exitosamente',
      })
    } catch (error) {
      logger.error('Error during admin logout', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * POST /admin/refresh
   * Renovar token de acceso de administrador
   */
  public async refreshToken({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user!
      const currentToken = user.currentAccessToken

      // Verificar que el usuario tenga rol de administrador
      const adminRole = await Role.findBy('code', 'ADMIN')
      if (!adminRole || user.roleId !== adminRole.id) {
        return response.forbidden({
          message: 'Acceso denegado. Se requieren permisos de administrador',
        })
      }

      if (!currentToken) {
        return response.badRequest({
          message: 'Token no válido para renovación',
          error: 'INVALID_TOKEN',
        })
      }

      // Crear nuevo token
      const newToken = await User.accessTokens.create(user, ['*'], {
        expiresIn: '24 hours',
      })

      // Eliminar token anterior por seguridad
      await User.accessTokens.delete(user, currentToken.identifier)

      // Log token refresh
      logger.info('Admin token refreshed successfully', {
        userId: user.id,
        email: user.email,
        oldTokenId: currentToken.identifier,
        newTokenId: newToken.identifier,
        timestamp: new Date().toISOString(),
      })

      return response.ok({
        message: 'Token renovado exitosamente',
        token: newToken.value!.release(),
        expiresAt: DateTime.now().plus({ hours: 24 }).toISO(),
        admin: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dni: user.dni,
          companyId: user.companyId,
          roleId: user.roleId,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      logger.error('Error during admin token refresh', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }
}
