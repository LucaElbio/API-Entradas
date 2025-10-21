import TransferStatus from '#models/transfer_status'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await TransferStatus.updateOrCreateMany('code', [
      { code: 'PENDING', name: 'Pendiente' },
      { code: 'ACCEPTED', name: 'Aceptada' },
      { code: 'REJECTED', name: 'Rechazada' },
      { code: 'EXPIRED', name: 'Expirada' },
    ])
  }
}
