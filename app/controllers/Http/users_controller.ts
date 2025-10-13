import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { registerUserValidator, loginUserValidator } from '#validators/user_validator'
import { DateTime } from 'luxon'

export default class UsersController {
  /**
   * Registro de usuario
   */
  public async register({ request, response, logger }: HttpContext) {
    const clientIp = request.ip()

    try {
      // Validar datos del request
      const data = await registerUserValidator.validate(request.all())

      // Log intento de registro
      logger.info('User registration attempt', {
        email: data.email,
        dni: data.dni,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      })

      // Crear usuario
      const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        dni: data.dni,
        password: data.password,
        companyId: data.companyId || 1,
        roleId: data.roleId || 2,
      })

      // Log registro exitoso
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      })

      return response.created({
        message: 'Usuario registrado exitosamente',
        user: {
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
      // Log error de registro
      logger.error('User registration failed', {
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

      console.error('Error registering user:', error)
      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * Iniciar sesión
   */
  public async login({ request, response, logger }: HttpContext) {
    const clientIp = request.ip()
    const userAgent = request.header('user-agent')
    const email = request.input('email', '').toLowerCase()

    try {
      const { email: validatedEmail, password } = await loginUserValidator.validate(request.body())

      // Log intento de login
      logger.info('User login attempt', {
        email: validatedEmail,
        ip: clientIp,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
      })

      // Usar el helper de autenticación para validar credenciales
      const user = await User.verifyCredentials(validatedEmail, password)

      // Crear token de acceso con expiración de 24 horas
      const token = await User.accessTokens.create(user, ['*'], {
        expiresIn: '24 hours',
      })

      // Log login exitoso
      logger.info('User login successful', {
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
        user: {
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
      logger.warn('User login failed', {
        email: email,
        ip: clientIp,
        userAgent: userAgent,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      logger.warn(error)
      if (error.messages) {
        return response.badRequest({
          message: 'Error de validación',
          errors: error.messages,
        })
      }

      // Cualquier error en verifyCredentials se trata como credenciales inválidas
      return response.badRequest({
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS',
      })
    }
  }

  /**
   * Perfil del usuario autenticado
   */
  public async me({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user!

      // Log acceso a perfil
      logger.info('User profile accessed', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      })

      return response.ok({
        user: {
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
      logger.error('Error getting user profile', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * Cerrar sesión
   */
  public async logout({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user
      const token = user?.currentAccessToken

      if (user && token) {
        await User.accessTokens.delete(user, token.identifier)

        // Log logout exitoso
        logger.info('User logout successful', {
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
      logger.error('Error during logout', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * Renovar token de acceso
   */
  public async refreshToken({ auth, response, logger }: HttpContext) {
    try {
      const user = auth.user!
      const currentToken = user.currentAccessToken

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
      logger.info('Token refreshed successfully', {
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
        user: {
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
      logger.error('Error during token refresh', {
        error: error.message,
        timestamp: new Date().toISOString(),
      })

      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }
}
