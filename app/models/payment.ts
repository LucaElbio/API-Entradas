import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reservation from './reservation.js'
import PaymentStatus from './payment_status.js'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare reservationId: number

  @column()
  declare statusId: number

  @column()
  declare amount: number

  @column()
  declare provider: string

  @column()
  declare externalRef: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Reservation)
  declare reservation: BelongsTo<typeof Reservation>

  @belongsTo(() => PaymentStatus, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof PaymentStatus>
}
