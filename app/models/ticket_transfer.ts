import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ticket from './ticket.js'
import User from './user.js'

export default class TicketTransfer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'ticket_id' })
  declare ticketId: number

  @column({ columnName: 'from_user_id' })
  declare fromUserId: number

  @column({ columnName: 'to_user_id' })
  declare toUserId: number

  @column({ columnName: 'status_id' })
  declare statusId: number

  @column({ columnName: 'receiver_contact' })
  declare receiverContact: string | null

  @column({ columnName: 'receiver_type' })
  declare receiverType: string | null

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime

  @column.dateTime({ columnName: 'responded_at' })
  declare respondedAt: DateTime | null

  @column({ columnName: 'old_qr' })
  declare oldQr: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Ticket, {
    foreignKey: 'ticketId',
  })
  declare ticket: BelongsTo<typeof Ticket>

  @belongsTo(() => User, {
    foreignKey: 'fromUserId',
  })
  declare fromUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'toUserId',
  })
  declare toUser: BelongsTo<typeof User>
}
