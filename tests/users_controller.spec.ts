// Mocks de dependencias
const mockRegisterValidate = jest.fn()
const mockLoginValidate = jest.fn()

jest.mock('#validators/user_validator', () => ({
  __esModule: true,
  registerUserValidator: { validate: mockRegisterValidate },
  loginUserValidator: { validate: mockLoginValidate },
}))

const mockHashMake = jest.fn(async (pwd: string) => `hashed:${pwd}`)
jest.mock('@adonisjs/core/services/hash', () => ({
  __esModule: true,
  default: {
    make: mockHashMake,
    use: jest.fn(() => ({
      verify: jest.fn(async (hash: string, plain: string) => hash === `hashed:${plain}`),
    })),
  },
}))

// Mock del modelo User y provider de tokens
const mockUserCreate = jest.fn()
const mockVerifyCredentials = jest.fn()
const mockTokensCreate = jest.fn()
const mockTokensDelete = jest.fn()

jest.mock('#models/user', () => ({
  __esModule: true,
  default: {
    create: mockUserCreate,
    verifyCredentials: mockVerifyCredentials,
    accessTokens: {
      create: mockTokensCreate,
      delete: mockTokensDelete,
    },
  },
}))

// Importar el controlador después de los mocks
const UsersController = require('#controllers/Http/users_controller').default

// Importar helper compartido
import { createHttpContext } from './helpers/http_context_helper'

describe('UsersController - Registro y Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Registro válido: crea usuario y devuelve 201', async () => {
    const controller = new UsersController()
    const payload = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      dni: '12345678',
      password: 'Strong1@',
    }

    mockRegisterValidate.mockResolvedValueOnce(payload)

    const now = new Date()
    mockUserCreate.mockResolvedValueOnce({
      id: 1,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.toLowerCase(),
      dni: payload.dni,
      companyId: 1,
      roleId: 2,
      createdAt: now,
    })

    const ctx = createHttpContext({ body: payload })
    const res = await controller.register(ctx as any)

    expect(mockRegisterValidate).toHaveBeenCalled()
    // Nota: No verificamos hash.make() aquí porque el hashing ocurre en el modelo User
    // mediante un hook @beforeSave, no directamente en el controlador
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email.toLowerCase(),
        dni: payload.dni,
        password: payload.password, // Se pasa plano, el modelo lo hashea
      })
    )
    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({
      message: 'Usuario registrado exitosamente',
      user: expect.objectContaining({ id: 1, email: payload.email.toLowerCase() }),
    })
  })

  it('Registro inválido: devuelve 400 con errores de validación', async () => {
    const controller = new UsersController()
    const payload = { firstName: '', lastName: 'P', email: 'mal', dni: 'abc', password: 'weak' }

    const validationError = Object.assign(new Error('Validation failed'), {
      messages: {
        email: ['Debe proporcionar un email válido'],
        password: ['La contraseña debe tener al menos 8 caracteres'],
      },
    })
    mockRegisterValidate.mockRejectedValueOnce(validationError)

    const ctx = createHttpContext({ body: payload })
    const res = await controller.register(ctx as any)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Error de validación',
      errors: validationError.messages,
    })
  })

  it('Rechaza emails duplicados: devuelve 400', async () => {
    const controller = new UsersController()
    const payload = {
      firstName: 'Ana',
      lastName: 'Gómez',
      email: 'ana@example.com',
      dni: '23456789',
      password: 'Strong2@',
    }

    const duplicateError = Object.assign(new Error('Duplicate email'), {
      messages: { email: ['Este email ya está registrado'] },
    })
    mockRegisterValidate.mockRejectedValueOnce(duplicateError)

    const ctx = createHttpContext({ body: payload })
    const res = await controller.register(ctx as any)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Error de validación',
      errors: duplicateError.messages,
    })
  })

  it('Login correcto: devuelve 200 con token', async () => {
    const controller = new UsersController()
    const payload = { email: 'user@example.com', password: 'Strong1@' }

    mockLoginValidate.mockResolvedValueOnce({ ...payload })

    const fakeUser = {
      id: 10,
      firstName: 'User',
      lastName: 'Test',
      email: payload.email,
      dni: '12345678',
      companyId: 1,
      roleId: 2,
      createdAt: new Date(),
    }
    mockVerifyCredentials.mockResolvedValueOnce(fakeUser)
    mockTokensCreate.mockResolvedValueOnce({
      identifier: 'tok_1',
      value: { release: () => 'token-value' },
    })

    const ctx = createHttpContext({ body: payload, headers: { 'user-agent': 'jest' } })
    const res = await controller.login(ctx as any)

    expect(mockVerifyCredentials).toHaveBeenCalledWith(payload.email, payload.password)
    expect(mockTokensCreate).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      message: 'Inicio de sesión exitoso',
      token: 'token-value',
      user: expect.objectContaining({ id: 10, email: payload.email }),
    })
  })

  it('Login incorrecto: credenciales inválidas devuelve 400', async () => {
    const controller = new UsersController()
    const payload = { email: 'user@example.com', password: 'Wrong' }

    mockLoginValidate.mockResolvedValueOnce({ ...payload })
    mockVerifyCredentials.mockRejectedValueOnce(
      new Error('E_INVALID_AUTH_UID: Invalid credentials')
    )

    const ctx = createHttpContext({ body: payload })
    const res = await controller.login(ctx as any)

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({
      message: 'Credenciales inválidas',
      error: 'INVALID_CREDENTIALS',
    })
  })
})
