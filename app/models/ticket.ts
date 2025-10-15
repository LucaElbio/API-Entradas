import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import User from './user.js'
import TicketTransfer from './ticket_transfer.js'
import TicketStatus from './ticket_status.js'

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'event_id' })
  declare eventId: number

  @column({ columnName: 'owner_id' })
  declare ownerId: number

  @column({ columnName: 'status_id' })
  declare statusId: number

  @column({ columnName: 'qr_code' })
  declare qrCode: string

  @column({ columnName: 'qr_image_url' })
  declare qrImageUrl: string | null

  @column.dateTime({ columnName: 'used_at' })
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Event, {
    foreignKey: 'eventId',
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => User, {
    foreignKey: 'ownerId',
  })
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => TicketStatus, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof TicketStatus>

  @hasMany(() => TicketTransfer, {
    foreignKey: 'ticketId',
  })
  declare transfers: HasMany<typeof TicketTransfer>
}
