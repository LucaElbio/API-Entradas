import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  public async run() {
    await db.table('ticket_statuses').insert([
      { id: 1, code: 'ACTIVE', name: 'Activo' },
      { id: 2, code: 'USED', name: 'Usado' },
      { id: 3, code: 'CANCELLED', name: 'Cancelado' },
      { id: 4, code: 'TRANSFERRED', name: 'Transferido' },
    ])
  }
}
