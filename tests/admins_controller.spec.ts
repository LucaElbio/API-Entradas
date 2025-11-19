// Mocks de dependencias para AdminsController
const mockAdminRegisterValidate = jest.fn()
const mockAdminLoginValidate = jest.fn()

jest.mock('#validators/admin_validator', () => ({
  __esModule: true,
  registerAdminValidator: { validate: mockAdminRegisterValidate },
  loginAdminValidator: { validate: mockAdminLoginValidate },
}))

const mockAdminHashMake = jest.fn(async (pwd: string) => `hashed:${pwd}`)
jest.mock('@adonisjs/core/services/hash', () => ({
  __esModule: true,
  default: {
    make: mockAdminHashMake,
    use: jest.fn(() => ({
      verify: jest.fn(async (hash: string, plain: string) => hash === `hashed:${plain}`),
    })),
  },
}))

// Mock del modelo User y Role
const mockAdminUserCreate = jest.fn()
const mockAdminVerifyCredentials = jest.fn()
const mockAdminTokensCreate = jest.fn()
const mockAdminTokensDelete = jest.fn()
const mockAdminRoleFindBy = jest.fn()

jest.mock('#models/user', () => ({
  __esModule: true,
  default: {
    create: mockAdminUserCreate,
    verifyCredentials: mockAdminVerifyCredentials,
    accessTokens: {
      create: mockAdminTokensCreate,
      delete: mockAdminTokensDelete,
    },
  },
}))

jest.mock('#models/role', () => ({
  __esModule: true,
  default: {
    findBy: mockAdminRoleFindBy,
  },
}))

// Importar el controlador después de los mocks
const AdminsController = require('#controllers/Http/admins_controller').default

// Importar helper compartido
import { createHttpContext } from './helpers/http_context_helper'

describe('AdminsController - Registro e Inicio de Sesión de Administrador', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registro de Administrador', () => {
    /**
     * Criterio: El formulario de registro debe incluir nombre, apellido, email y contraseña
     */
    it('debe registrar administrador con todos los campos requeridos (nombre, apellido, email, contraseña)', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'Carlos',
        lastName: 'Administrador',
        email: 'carlos.admin@example.com',
        dni: '12345678',
        password: 'Admin123',
        companyId: 1,
      }

      // Mock del rol de administrador
      const adminRole = { id: 1, code: 'ADMIN', name: 'Administrador' }
      mockAdminRoleFindBy.mockResolvedValueOnce(adminRole)
      mockAdminRegisterValidate.mockResolvedValueOnce(payload)

      const now = new Date()
      mockAdminUserCreate.mockResolvedValueOnce({
        id: 1,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email.toLowerCase(),
        dni: payload.dni,
        companyId: payload.companyId,
        roleId: adminRole.id,
        createdAt: now,
      })

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(mockAdminRoleFindBy).toHaveBeenCalledWith('code', 'ADMIN')
      expect(mockAdminRegisterValidate).toHaveBeenCalled()
      expect(mockAdminUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email.toLowerCase(),
          password: payload.password,
          roleId: adminRole.id,
        })
      )
      expect(res.statusCode).toBe(201)
      expect(res.body).toMatchObject({
        message: 'Administrador registrado exitosamente',
        admin: expect.objectContaining({
          id: 1,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email.toLowerCase(),
        }),
      })
    })

    /**
     * Criterio: Validar que el email no esté registrado previamente
     */
    it('debe rechazar registro con email duplicado', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'Ana',
        lastName: 'Admin',
        email: 'duplicado@example.com',
        dni: '23456789',
        password: 'Admin123',
      }

      const duplicateError = Object.assign(new Error('Email duplicado'), {
        messages: { email: ['Este email ya está registrado'] },
      })
      mockAdminRegisterValidate.mockRejectedValueOnce(duplicateError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.objectContaining({
          email: expect.arrayContaining(['Este email ya está registrado']),
        }),
      })
    })

    /**
     * Criterio: La contraseña debe tener mínimo 8 caracteres
     */
    it('debe rechazar contraseña con menos de 8 caracteres', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'Pedro',
        lastName: 'Admin',
        email: 'pedro@example.com',
        dni: '34567890',
        password: 'Pass1', // Solo 5 caracteres
      }

      const validationError = Object.assign(new Error('Validación fallida'), {
        messages: {
          password: ['La contraseña debe tener al menos 8 caracteres'],
        },
      })
      mockAdminRegisterValidate.mockRejectedValueOnce(validationError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.objectContaining({
          password: expect.arrayContaining([
            expect.stringContaining('8 caracteres'),
          ]),
        }),
      })
    })

    /**
     * Criterio: La contraseña debe tener al menos una mayúscula
     */
    it('debe rechazar contraseña sin mayúscula', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'Luis',
        lastName: 'Admin',
        email: 'luis@example.com',
        dni: '45678901',
        password: 'minuscula123', // Sin mayúscula
      }

      const validationError = Object.assign(new Error('Validación fallida'), {
        messages: {
          password: [
            'La contraseña debe contener al menos una letra mayúscula',
          ],
        },
      })
      mockAdminRegisterValidate.mockRejectedValueOnce(validationError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.objectContaining({
          password: expect.arrayContaining([
            expect.stringContaining('mayúscula'),
          ]),
        }),
      })
    })

    /**
     * Criterio: La contraseña debe tener al menos un número
     */
    it('debe rechazar contraseña sin número', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'María',
        lastName: 'Admin',
        email: 'maria@example.com',
        dni: '56789012',
        password: 'SinNumero', // Sin número
      }

      const validationError = Object.assign(new Error('Validación fallida'), {
        messages: {
          password: ['La contraseña debe contener al menos un número'],
        },
      })
      mockAdminRegisterValidate.mockRejectedValueOnce(validationError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.objectContaining({
          password: expect.arrayContaining([
            expect.stringContaining('número'),
          ]),
        }),
      })
    })

    /**
     * Criterio: Mostrar mensaje de error si los datos son inválidos
     */
    it('debe mostrar mensajes de error con múltiples campos inválidos', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: '', // Vacío
        lastName: 'A', // Muy corto
        email: 'email-invalido', // Email mal formado
        dni: 'abc', // DNI inválido
        password: 'weak', // Contraseña débil
      }

      const validationError = Object.assign(new Error('Validación fallida'), {
        messages: {
          firstName: ['El nombre es obligatorio'],
          lastName: ['El apellido debe tener al menos 2 caracteres'],
          email: ['Debe proporcionar un email válido'],
          dni: ['El DNI debe contener solo números'],
          password: [
            'La contraseña debe tener al menos 8 caracteres',
            'La contraseña debe contener al menos una letra mayúscula',
            'La contraseña debe contener al menos un número',
          ],
        },
      })
      mockAdminRegisterValidate.mockRejectedValueOnce(validationError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.any(Object),
      })
      expect(res.body.errors).toHaveProperty('firstName')
      expect(res.body.errors).toHaveProperty('lastName')
      expect(res.body.errors).toHaveProperty('email')
      expect(res.body.errors).toHaveProperty('password')
    })

    /**
     * Criterio: Manejo de error cuando el rol ADMIN no existe en la base de datos
     */
    it('debe devolver error 500 si el rol ADMIN no existe', async () => {
      const controller = new AdminsController()
      const payload = {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'test@example.com',
        dni: '67890123',
        password: 'Admin123',
      }

      mockAdminRoleFindBy.mockResolvedValueOnce(null) // Rol no encontrado
      mockAdminRegisterValidate.mockResolvedValueOnce(payload)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.register(ctx as any)

      expect(res.statusCode).toBe(500)
      expect(res.body).toMatchObject({
        message: 'Error: Rol de administrador no encontrado en el sistema',
      })
    })
  })

  describe('Inicio de Sesión de Administrador', () => {
    /**
     * Criterio: Al iniciar sesión, si las credenciales son correctas, 
     * acceder al panel de administrador
     */
    it('debe permitir login con credenciales correctas y rol ADMIN', async () => {
      const controller = new AdminsController()
      const payload = { email: 'admin@example.com', password: 'Admin123' }

      mockAdminLoginValidate.mockResolvedValueOnce({ ...payload })

      const adminRole = { id: 1, code: 'ADMIN', name: 'Administrador' }
      mockAdminRoleFindBy.mockResolvedValueOnce(adminRole)

      const fakeAdmin = {
        id: 10,
        firstName: 'Admin',
        lastName: 'Principal',
        email: payload.email,
        dni: '12345678',
        companyId: 1,
        roleId: adminRole.id,
        createdAt: new Date(),
      }
      mockAdminVerifyCredentials.mockResolvedValueOnce(fakeAdmin)
      mockAdminTokensCreate.mockResolvedValueOnce({
        identifier: 'tok_admin_1',
        value: { release: () => 'admin-token-value' },
      })

      const ctx = createHttpContext({
        body: payload,
        headers: { 'user-agent': 'jest-test' },
      })
      const res = await controller.login(ctx as any)

      expect(mockAdminVerifyCredentials).toHaveBeenCalledWith(
        payload.email,
        payload.password
      )
      expect(mockAdminRoleFindBy).toHaveBeenCalledWith('code', 'ADMIN')
      expect(mockAdminTokensCreate).toHaveBeenCalledWith(
        fakeAdmin,
        ['*'],
        { expiresIn: '24 hours' }
      )
      expect(res.statusCode).toBe(200)
      expect(res.body).toMatchObject({
        message: 'Inicio de sesión exitoso',
        token: 'admin-token-value',
        admin: expect.objectContaining({
          id: 10,
          email: payload.email,
        }),
      })
    })

    /**
     * Criterio: Mostrar mensaje de error si las credenciales son inválidas
     */
    it('debe rechazar login con credenciales incorrectas', async () => {
      const controller = new AdminsController()
      const payload = { email: 'admin@example.com', password: 'WrongPassword' }

      mockAdminLoginValidate.mockResolvedValueOnce({ ...payload })
      mockAdminVerifyCredentials.mockRejectedValueOnce(
        new Error('E_INVALID_AUTH_UID: Invalid credentials')
      )

      const ctx = createHttpContext({ body: payload })
      const res = await controller.login(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Credenciales inválidas',
      })
    })

    /**
     * Criterio: Debe validar que el usuario tenga permisos de administrador
     */
    it('debe rechazar login de usuario sin rol ADMIN', async () => {
      const controller = new AdminsController()
      const payload = { email: 'usuario@example.com', password: 'User123' }

      mockAdminLoginValidate.mockResolvedValueOnce({ email: payload.email, password: payload.password })

      const adminRole = { id: 1, code: 'ADMIN', name: 'Administrador' }
      mockAdminRoleFindBy.mockResolvedValueOnce(adminRole)

      const regularUser = {
        id: 20,
        firstName: 'Usuario',
        lastName: 'Regular',
        email: payload.email,
        dni: '98765432',
        companyId: 1,
        roleId: 2, // Rol diferente a ADMIN
        createdAt: new Date(),
      }
      mockAdminVerifyCredentials.mockResolvedValueOnce(regularUser)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.login(ctx as any)

      expect(res.statusCode).toBe(403)
      expect(res.body).toMatchObject({
        message: 'Acceso denegado. Se requieren permisos de administrador',
      })
    })

    /**
     * Criterio: Mostrar mensaje de error si el email es inválido
     */
    it('debe rechazar login con email mal formado', async () => {
      const controller = new AdminsController()
      const payload = { email: 'email-invalido', password: 'Admin123' }

      const validationError = Object.assign(new Error('Validación fallida'), {
        messages: {
          email: ['Debe proporcionar un email válido'],
        },
      })
      mockAdminLoginValidate.mockRejectedValueOnce(validationError)

      const ctx = createHttpContext({ body: payload })
      const res = await controller.login(ctx as any)

      expect(res.statusCode).toBe(400)
      expect(res.body).toMatchObject({
        message: 'Error de validación',
        errors: expect.objectContaining({
          email: ['Debe proporcionar un email válido'],
        }),
      })
    })

    /**
     * Criterio: Debe manejar error cuando el rol ADMIN no existe
     */
    it('debe devolver error 403 si el rol ADMIN no existe al hacer login', async () => {
      const controller = new AdminsController()
      const payload = { email: 'admin@example.com', password: 'Admin123' }

      mockAdminLoginValidate.mockResolvedValueOnce({ email: payload.email, password: payload.password })

      const fakeAdmin = {
        id: 10,
        firstName: 'Admin',
        lastName: 'Principal',
        email: payload.email,
        dni: '12345678',
        companyId: 1,
        roleId: 1,
        createdAt: new Date(),
      }
      mockAdminVerifyCredentials.mockResolvedValueOnce(fakeAdmin)
      mockAdminRoleFindBy.mockResolvedValueOnce(null) // Rol no encontrado

      const ctx = createHttpContext({ body: payload })
      const res = await controller.login(ctx as any)

      expect(res.statusCode).toBe(403)
      expect(res.body).toMatchObject({
        message: 'Acceso denegado. Se requieren permisos de administrador',
      })
    })
  })
})
