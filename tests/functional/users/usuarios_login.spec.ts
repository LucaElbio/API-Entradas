import { test } from '@japa/runner'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

test.group('Users - Nuevo Endpoint /usuarios/login', (group) => {
  group.each.setup(async () => {
    // Solo limpiar la tabla de usuarios y tokens, no las companies y roles
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('should login user with valid credentials via /usuarios/login', async ({ client }) => {
    // Crear un usuario de prueba - Sin hash manual
    const user = await User.create({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: 'Password123', // Texto plano
      companyId: 1,
      roleId: 2,
    })

    const loginData = {
      email: 'juan.perez@example.com',
      password: 'Password123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        dni: '12345678',
      },
    })

    // Debe retornar un token
    response.assertBodyContains({ token: response.body().token })
  })

  test('should not login with invalid email via /usuarios/login', async ({ client }) => {
    const loginData = {
      email: 'noexiste@example.com',
      password: 'Password123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Credenciales inválidas',
    })
  })

  test('should not login with invalid password via /usuarios/login', async ({ client }) => {
    // Crear un usuario de prueba - Sin hash manual
    await User.create({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: 'Password123', // Texto plano
      companyId: 1,
      roleId: 2,
    })

    const loginData = {
      email: 'juan.perez@example.com',
      password: 'ContraseñaIncorrecta',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Credenciales inválidas',
    })
  })

  test('should validate email format on login via /usuarios/login', async ({ client }) => {
    const loginData = {
      email: 'email-invalido',
      password: 'Password123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should require all fields for login via /usuarios/login', async ({ client }) => {
    const response = await client.post('/usuarios/login').json({})

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should return token with proper structure via /usuarios/login', async ({ client }) => {
    // Crear un usuario de prueba - Sin hash manual
    await User.create({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana.garcia@example.com',
      dni: '87654321',
      password: 'SecurePass123', // Texto plano
      companyId: 1,
      roleId: 2,
    })

    const loginData = {
      email: 'ana.garcia@example.com',
      password: 'SecurePass123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(200)

    // Verificar estructura del token
    const body = response.body()
    response.assert?.exists(body.token)
    response.assert?.isString(body.token)
    response.assert?.isTrue(body.token.startsWith('oat_'))

    // Verificar estructura del usuario
    response.assertBodyContains({
      user: {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana.garcia@example.com',
        dni: '87654321',
        companyId: 1,
        roleId: 2,
      },
    })
  })

  test('should handle case insensitive email via /usuarios/login', async ({ client }) => {
    // Crear un usuario con email en minúsculas - Sin hash manual
    await User.create({
      firstName: 'Carlos',
      lastName: 'López',
      email: 'carlos.lopez@example.com',
      dni: '11223344',
      password: 'MyPassword123', // Texto plano
      companyId: 1,
      roleId: 2,
    })

    // Login con email en mayúsculas
    const loginData = {
      email: 'CARLOS.LOPEZ@EXAMPLE.COM',
      password: 'MyPassword123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Inicio de sesión exitoso',
      user: {
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos.lopez@example.com',
      },
    })
  })
})
