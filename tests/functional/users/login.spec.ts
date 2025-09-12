import { test } from '@japa/runner'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

test.group('Users - Login', (group) => {
  group.each.setup(async () => {
    // Solo limpiar la tabla de usuarios y tokens, no las companies y roles
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('should login user with valid credentials', async ({ client }) => {
    // Create a test user
    const user = await User.create({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: await hash.make('Password123'),
      companyId: 1,
      roleId: 2,
    })

    const loginData = {
      email: 'juan.perez@example.com',
      password: 'Password123',
    }

    const response = await client.post('/auth/login').json(loginData)

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

    // Should return a token
    response.assertBodyContains({ token: response.body().token })
  })

  test('should not login with invalid email', async ({ client }) => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'Password123',
    }

    const response = await client.post('/auth/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Credenciales inválidas',
    })
  })

  test('should not login with invalid password', async ({ client }) => {
    // Create a test user
    await User.create({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: await hash.make('Password123'),
      companyId: 1,
      roleId: 2,
    })

    const loginData = {
      email: 'juan.perez@example.com',
      password: 'WrongPassword',
    }

    const response = await client.post('/auth/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Credenciales inválidas',
    })
  })

  test('should validate email format on login', async ({ client }) => {
    const loginData = {
      email: 'invalid-email',
      password: 'Password123',
    }

    const response = await client.post('/auth/login').json(loginData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should require all fields for login', async ({ client }) => {
    const response = await client.post('/auth/login').json({})

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })
})
