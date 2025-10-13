import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    await db.table('ticket_statuses').insert([
      { id: 1, code: 'active', name: 'Activo' },
      { id: 2, code: 'used', name: 'Usado' },
      { id: 3, code: 'cancelled', name: 'Cancelado' },
      { id: 4, code: 'transferred', name: 'Transferido' },
    ])
  }
}