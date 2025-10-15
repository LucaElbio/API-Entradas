import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Event from './event.js'
import Reservation from './reservation.js'
import User from './user.js'
import TicketStatus from './ticket_status.js'

export default class Ticket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare eventId: number

  @column()
  declare reservationId: number

  @column()
  declare ownerId: number

  @column()
  declare statusId: number

  @column()
  declare qrCode: string

  @column()
  declare qrImageUrl: string | null

  @column.dateTime()
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Reservation)
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => User, {
    foreignKey: 'ownerId',
  })
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => TicketStatus, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof TicketStatus>
}
