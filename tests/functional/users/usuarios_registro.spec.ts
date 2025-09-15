import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Users - Nuevo Endpoint /usuarios/registro', (group) => {
  group.each.setup(async () => {
    // Solo limpiar la tabla de usuarios y tokens, no las companies y roles
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('should register user via /usuarios/registro endpoint', async ({ client }) => {
    const userData = {
      firstName: 'Carlos',
      lastName: 'González',
      email: 'carlos.gonzalez@example.com',
      dni: '23456789',
      password: 'SecurePass123!',
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Usuario registrado exitosamente',
      user: {
        firstName: 'Carlos',
        lastName: 'González',
        email: 'carlos.gonzalez@example.com',
        dni: '23456789',
      },
    })
  })

  test('should validate required fields in /usuarios/registro', async ({ client }) => {
    const response = await client.post('/usuarios/registro').json({})

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should prevent duplicate email in /usuarios/registro', async ({ client }) => {
    // Crear primer usuario
    const userData = {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@example.com',
      dni: '34567890',
      password: 'SecurePass123!',
    }

    await client.post('/usuarios/registro').json(userData)

    // Intentar crear usuario con mismo email
    const duplicateUserData = {
      firstName: 'Ana',
      lastName: 'Díaz',
      email: 'ana.martinez@example.com', // Email duplicado
      dni: '45678901',
      password: 'SecurePass123!',
    }

    const response = await client.post('/usuarios/registro').json(duplicateUserData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should prevent duplicate DNI in /usuarios/registro', async ({ client }) => {
    // Crear primer usuario
    const userData = {
      firstName: 'Luis',
      lastName: 'Rodríguez',
      email: 'luis.rodriguez@example.com',
      dni: '56789012',
      password: 'SecurePass123!',
    }

    await client.post('/usuarios/registro').json(userData)

    // Intentar crear usuario con mismo DNI
    const duplicateUserData = {
      firstName: 'Luis',
      lastName: 'García',
      email: 'luis.garcia@example.com',
      dni: '56789012', // DNI duplicado
      password: 'SecurePass123!',
    }

    const response = await client.post('/usuarios/registro').json(duplicateUserData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })

  test('should enforce password security in /usuarios/registro', async ({ client }) => {
    const userData = {
      firstName: 'María',
      lastName: 'López',
      email: 'maria.lopez@example.com',
      dni: '67890123',
      password: 'weak', // Contraseña débil
    }

    const response = await client.post('/usuarios/registro').json(userData)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Error de validación',
    })
  })
})
