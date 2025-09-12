import { test } from '@japa/runner'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

test.group('Debug - Login Issues', (group) => {
  group.each.setup(async () => {
    // Limpiar datos de test
    await db.rawQuery('DELETE FROM auth_access_tokens')
    await db.rawQuery('DELETE FROM users')
  })

  test('debug - check what happens on login', async ({ client, assert }) => {
    // 1. Verificar que companies y roles existen
    const companies = await db.rawQuery('SELECT * FROM companies LIMIT 1')
    const roles = await db.rawQuery('SELECT * FROM roles LIMIT 1')

    console.log('Companies:', companies)
    console.log('Roles:', roles)

    // 2. Password sin hashear manualmente - que AuthFinder lo haga
    const plainPassword = 'Password123'

    console.log('Plain password:', plainPassword)

    // 3. Crear usuario de prueba - password en texto plano
    await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      dni: '12345678',
      password: plainPassword, // Texto plano - AuthFinder lo hasheará automáticamente
      companyId: companies[0]?.length > 0 ? companies[0][0].id : 1,
      roleId: roles[0]?.length > 0 ? roles[0][0].id : 1,
    })

    console.log('User created')

    // 4. Verificar que el usuario se guardó correctamente
    const savedUser = await User.findBy('email', 'test@example.com')
    console.log('Saved user password hash:', savedUser?.password)

    // 5. Verificar hash manualmente con ambos órdenes
    const isHashValid1 = await hash.verify(savedUser!.password, plainPassword)
    const isHashValid2 = await hash.verify(plainPassword, savedUser!.password)
    console.log('Hash verification (hash, plain):', isHashValid1)
    console.log('Hash verification (plain, hash):', isHashValid2)

    // 6. Afirmación mínima para usar `assert` y evitar warning de TS
    assert.isTrue(typeof savedUser?.password === 'string')

    // 7. Probar login
    const loginData = {
      email: 'test@example.com',
      password: 'Password123',
    }

    const response = await client.post('/usuarios/login').json(loginData)

    console.log('Login response status:', response.status())
    console.log('Login response body:', response.body())

    // No hacemos assert por ahora, solo vemos qué pasa
  })

  test('debug - check auth/login endpoint too', async ({ client }) => {
    // Crear usuario - Sin hash manual
    await User.create({
      firstName: 'Test2',
      lastName: 'User2',
      email: 'test2@example.com',
      dni: '87654321',
      password: 'Password123', // Texto plano
      companyId: 1,
      roleId: 1,
    })

    const loginData = {
      email: 'test2@example.com',
      password: 'Password123',
    }

    const response = await client.post('/auth/login').json(loginData)

    console.log('Auth login response status:', response.status())
    console.log('Auth login response body:', response.body())
  })
})
