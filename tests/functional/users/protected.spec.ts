import { test } from '@japa/runner'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

test.group('Users - Protected Routes', (group) => {
  group.each.setup(async () => {
    // Solo limpiar la tabla de usuarios y tokens, no las companies y roles
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('should get user profile when authenticated', async ({ client }) => {
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

    // Create access token
    const token = await User.accessTokens.create(user)

    const response = await client.get('/auth/me').bearerToken(token.value!.release())

    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        id: user.id,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        dni: '12345678',
      },
    })
  })

  test('should not get user profile without authentication', async ({ client }) => {
    const response = await client.get('/auth/me')

    response.assertStatus(401)
  })

  test('should logout user successfully', async ({ client }) => {
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

    // Create access token
    const token = await User.accessTokens.create(user)

    const response = await client.post('/auth/logout').bearerToken(token.value!.release())

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Sesión cerrada exitosamente',
    })
  })

  test('should not logout without authentication', async ({ client }) => {
    const response = await client.post('/auth/logout')

    response.assertStatus(401)
  })
})
