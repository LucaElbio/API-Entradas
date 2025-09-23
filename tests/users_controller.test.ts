import UsersController from '#controllers/Http/users_controller'

// Mocks de dependencias externas
jest.mock('@adonisjs/core/services/hash', () => ({
  __esModule: true,
  default: {
    make: jest.fn(async (pwd: string) => `hashed:${pwd}`),
    use: jest.fn(() => ({
      verify: jest.fn(async () => true),
    })),
  },
}))

// Mock de modelo User y sus métodos estáticos
const mockUserCreate = jest.fn()
const mockVerifyCredentials = jest.fn()
const mockAccessTokensCreate = jest.fn()
const mockAccessTokensDelete = jest.fn()

jest.mock('#models/user', () => ({
  __esModule: true,
  default: {
    create: (...args: any[]) => mockUserCreate(...args),
    verifyCredentials: (...args: any[]) => mockVerifyCredentials(...args),
    accessTokens: {
      create: (...args: any[]) => mockAccessTokensCreate(...args),
      delete: (...args: any[]) => mockAccessTokensDelete(...args),
    },
  },
}))

// Mock de validators para controlar escenarios
const mockRegisterValidate = jest.fn()
const mockLoginValidate = jest.fn()

jest.mock('#validators/user_validator', () => ({
  __esModule: true,
  registerUserValidator: { validate: (...args: any[]) => mockRegisterValidate(...args) },
  loginUserValidator: { validate: (...args: any[]) => mockLoginValidate(...args) },
}))

// Utilidad para simular HttpContext mínimo
function makeCtx({
  body = {},
  ip = '127.0.0.1',
  userAgent = 'jest-test',
}: {
  body?: any
  ip?: string
  userAgent?: string
}) {
  const req = {
    all: () => body,
    body: () => body,
    input: (key: string, def?: any) => (key in body ? body[key] : def),
    ip: () => ip,
    header: (name: string) => (name.toLowerCase() === 'user-agent' ? userAgent : undefined),
  } as any

  const resPayload: { status?: number; body?: any } = {}
  const res = {
    created: (payload: any) => {
      resPayload.status = 201
      resPayload.body = payload
      return payload
    },
    ok: (payload: any) => {
      resPayload.status = 200
      resPayload.body = payload
      return payload
    },
    badRequest: (payload: any) => {
      resPayload.status = 400
      resPayload.body = payload
      return payload
    },
    internalServerError: (payload: any) => {
      resPayload.status = 500
      resPayload.body = payload
      return payload
    },
  } as any

  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as any

  return { ctx: { request: req, response: res, logger } as any, resState: resPayload }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('UsersController - Registro', () => {
  test('debe registrar usuario con datos válidos', async () => {
    const controller = new UsersController()
    const body = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'User@Email.com',
      dni: '12345678',
      password: 'ClaveSegura1!',
      companyId: 1,
      roleId: 2,
    }
    const { ctx, resState } = makeCtx({ body })

    // validator devuelve los datos validados
    mockRegisterValidate.mockResolvedValueOnce({ ...body, email: 'user@email.com' })

    // simulamos creación de usuario
    const fakeUser = {
      id: 10,
      firstName: body.firstName,
      lastName: body.lastName,
      email: 'user@email.com',
      dni: body.dni,
      companyId: body.companyId,
      roleId: body.roleId,
      createdAt: new Date(),
    }
    mockUserCreate.mockResolvedValueOnce(fakeUser)

    await controller.register(ctx)

    expect(resState.status).toBe(201)
    expect(resState.body?.message).toBe('Usuario registrado exitosamente')
    expect(resState.body?.user).toMatchObject({
      id: 10,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'user@email.com',
      dni: '12345678',
      companyId: 1,
      roleId: 2,
    })
    // Se hashea la contraseña
    const hash = (await import('@adonisjs/core/services/hash')).default as any
    expect(hash.make).toHaveBeenCalledWith('ClaveSegura1!')
  })

  test('debe rechazar registro inválido (validación)', async () => {
    const controller = new UsersController()
    const body = {
      firstName: 'J', // muy corto
      lastName: 'Perez',
      email: 'invalido',
      dni: 'abc', // no numérico
      password: 'corta', // insegura
    }
    const { ctx, resState } = makeCtx({ body })

    mockRegisterValidate.mockRejectedValueOnce({
      messages: {
        errors: [
          { field: 'firstName', rule: 'minLength', message: 'El nombre debe tener al menos 2 caracteres' },
          { field: 'email', rule: 'email', message: 'Debe proporcionar un email válido' },
          { field: 'dni', rule: 'regex', message: 'El DNI solo puede contener números' },
          { field: 'password', rule: 'regex', message: 'La contraseña debe contener requisitos mínimos' },
        ],
      },
    })

    await controller.register(ctx)

    expect(resState.status).toBe(400)
    expect(resState.body?.message).toBe('Error de validación')
    expect(resState.body?.errors?.errors?.length).toBeGreaterThan(0)
  })

  test('debe rechazar emails duplicados', async () => {
    const controller = new UsersController()
    const body = {
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@example.com',
      dni: '23456789',
      password: 'Password1!',
    }
    const { ctx, resState } = makeCtx({ body })

    // Simulamos que el validador detecta email duplicado
    mockRegisterValidate.mockRejectedValueOnce({
      messages: {
        errors: [
          { field: 'email', rule: 'unique', message: 'Este email ya está registrado' },
        ],
      },
    })

    await controller.register(ctx)

    expect(resState.status).toBe(400)
    expect(resState.body?.message).toBe('Error de validación')
    const errors = resState.body?.errors?.errors || []
    expect(errors.some((e: any) => e.field === 'email' && e.rule === 'unique')).toBe(true)
  })
})

describe('UsersController - Login', () => {
  test('login correcto devuelve token y usuario', async () => {
    const controller = new UsersController()
    const body = { email: 'user@example.com', password: 'Password1!' }
    const { ctx, resState } = makeCtx({ body })

    mockLoginValidate.mockResolvedValueOnce(body)

    const fakeUser = {
      id: 20,
      firstName: 'User',
      lastName: 'Example',
      email: 'user@example.com',
      dni: '12345678',
      companyId: 1,
      roleId: 2,
      createdAt: new Date(),
      currentAccessToken: { identifier: 'oldtoken' },
    }
    mockVerifyCredentials.mockResolvedValueOnce(fakeUser)

    mockAccessTokensCreate.mockResolvedValueOnce({
      identifier: 'token123',
      value: { release: () => 'token-value' },
    })

    await controller.login(ctx)

    expect(resState.status).toBe(200)
    expect(resState.body?.message).toBe('Inicio de sesión exitoso')
    expect(resState.body?.token).toBe('token-value')
    expect(resState.body?.user).toMatchObject({ id: 20, email: 'user@example.com' })
  })

  test('login incorrecto devuelve credenciales inválidas', async () => {
    const controller = new UsersController()
    const body = { email: 'user@example.com', password: 'WrongPass1!' }
    const { ctx, resState } = makeCtx({ body })

    mockLoginValidate.mockResolvedValueOnce(body)
    mockVerifyCredentials.mockRejectedValueOnce(new Error('Invalid credentials'))

    await controller.login(ctx)

    expect(resState.status).toBe(400)
    expect(resState.body?.message).toBe('Credenciales inválidas')
    expect(resState.body?.error).toBe('INVALID_CREDENTIALS')
  })
})
