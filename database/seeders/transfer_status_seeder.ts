import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await db.table('transfer_statuses').insert([
      { id: 1, code: 'PENDING', name: 'Pendiente' },
      { id: 2, code: 'ACCEPTED', name: 'Aceptada' },
      { id: 3, code: 'REJECTED', name: 'Rechazada' },
      { id: 4, code: 'EXPIRED', name: 'Expirada' },
    ])
  }
}
