import { BaseCommand } from '@adonisjs/core/ace'
import { DateTime } from 'luxon'
import TicketTransfer from '#models/ticket_transfer'
import db from '@adonisjs/lucid/services/db'

export default class ExpireTransfers extends BaseCommand {
  static commandName = 'tickets:expire-transfers'
  static description =
    'Expirar transferencias de tickets pendientes que han pasado el tiempo límite'

  async run() {
    this.logger.info('Verificando transferencias expiradas...')

    // Obtener IDs de estados
    const pendingStatus = await db.from('transfer_statuses').where('code', 'pending').first()
    const expiredStatus = await db.from('transfer_statuses').where('code', 'expired').first()

    const expiredTransfers = await TicketTransfer.query()
      .where('status_id', pendingStatus.id)
      .where('expires_at', '<=', DateTime.now().toSQL())

    if (expiredTransfers.length === 0) {
      this.logger.info('No hay transferencias expiradas')
      return
    }

    for (const transfer of expiredTransfers) {
      transfer.statusId = expiredStatus.id
      await transfer.save()
    }

    this.logger.success(`${expiredTransfers.length} transferencia(s) expirada(s)`)
  }
}
