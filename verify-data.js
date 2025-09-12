import Company from '#models/company'
import Role from '#models/role'
import User from '#models/user'

// Verificar los datos en la base de datos
console.log('=== Verificando datos en la base de datos ===')

try {
  const companies = await Company.all()
  console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name })))
  
  const roles = await Role.all()
  console.log('Roles:', roles.map(r => ({ id: r.id, code: r.code, name: r.name })))
  
  const users = await User.all()
  console.log('Users:', users.map(u => ({ id: u.id, firstName: u.firstName, email: u.email })))
  
} catch (error) {
  console.error('Error:', error)
}

process.exit(0)
