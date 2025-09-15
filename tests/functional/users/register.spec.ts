import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Users - Register', (group) => {
  group.each.setup(async () => {
    // Solo limpiar la tabla de usuarios y tokens, no las companies y roles
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('should register a new user successfully', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: 'Password123!',
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Usuario registrado exitosamente',
      user: {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        dni: '12345678',
      },
    })
  })

  test('should not register user with invalid email', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'invalid-email',
      dni: '12345678',
      password: 'Password123!',
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should not register user with weak password', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '12345678',
      password: 'weak',
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should not register user with invalid DNI', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      dni: '123abc',
      password: 'Password123!',
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should not register user with duplicate email', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'duplicate@example.com',
      dni: '12345678',
      password: 'Password123!',
    }

    // Register first user
    await client.post('/usuarios/registro').json(userData)

    // Try to register second user with same email
    const secondUserData = {
      ...userData,
      dni: '87654321',
    }

    const response = await client.post('/usuarios/registro').json(secondUserData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should not register user with duplicate DNI', async ({ client }) => {
    const userData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@example.com',
      dni: '12345678',
      password: 'Password123!',
    }

    // Register first user
    await client.post('/usuarios/registro').json(userData)

    // Try to register second user with same DNI
    const secondUserData = {
      ...userData,
      email: 'another@example.com',
    }

    const response = await client.post('/usuarios/registro').json(secondUserData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should validate required fields', async ({ client }) => {
    const response = await client.post('/usuarios/registro').json({})

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })
})
