import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { registerUserValidator, loginUserValidator } from '#validators/user_validator'

export default class UsersController {
  /**
   * Registro de usuario
   */
  public async register({ request, response }: HttpContext) {
    try {
      // Validar datos del request
      const data = await registerUserValidator.validate(request.all())

      // Hashear contraseña
      const hashedPassword = await hash.make(data.password)

      // Crear usuario
      const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        dni: data.dni,
        password: hashedPassword,
        companyId: data.companyId || 1,
        roleId: data.roleId || 2,
      })

      return response.created({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          dni: user.dni,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
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
  public async login({ request, response }: HttpContext) {
    try {
      const { email, password } = await loginUserValidator.validate(request.body())

      // Buscar usuario
      const user = await User.findBy('email', email.toLowerCase())
      if (!user) {
        return response.badRequest({ message: 'Credenciales inválidas' })
      }

      // Verificar contraseña
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.badRequest({ message: 'Credenciales inválidas' })
      }

      // Crear token de acceso
      const token = await User.accessTokens.create(user)

      return response.ok({
        message: 'Inicio de sesión exitoso',
        token: token.value!.release(),
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
      if (error.messages) {
        return response.badRequest({
          message: 'Error de validación',
          errors: error.messages,
        })
      }

      console.error('Error during login:', error)
      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * Perfil del usuario autenticado
   */
  public async me({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

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
      console.error('Error getting user profile:', error)
      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }

  /**
   * Cerrar sesión
   */
  public async logout({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      const token = user?.currentAccessToken

      if (user && token) {
        await User.accessTokens.delete(user, token.identifier)
      }

      return response.ok({
        message: 'Sesión cerrada exitosamente',
      })
    } catch (error) {
      console.error('Error during logout:', error)
      return response.internalServerError({
        message: 'Error interno del servidor',
      })
    }
  }
}
