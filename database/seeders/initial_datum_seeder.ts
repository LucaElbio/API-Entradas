import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Company from '#models/company'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    // Crear compañía por defecto
    await Company.firstOrCreate(
      { taxId: 'DEFAULT-001' },
      {
        name: 'API Entradas Company',
        taxId: 'DEFAULT-001',
        address: 'Dirección por defecto',
      }
    )

    // Crear roles por defecto
    const roles = [
      { code: 'ADMIN', name: 'Administrador' },
      { code: 'USER', name: 'Usuario' },
      { code: 'MANAGER', name: 'Manager' },
    ]

    for (const roleData of roles) {
      await Role.firstOrCreate({ code: roleData.code }, roleData)
    }
  }
}
