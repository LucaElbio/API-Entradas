import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Venue from './venue.js'
import User from './user.js'
import EventStatus from './event_status.js'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare companyId: number

  @column()
  declare venueId: number

  @column()
  declare createdBy: number

  @column()
  declare statusId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column.date({
    serialize: (value: DateTime) => {
      // Serializar solo como fecha (YYYY-MM-DD)
      return value ? value.toISODate() : null
    },
  })
  declare datetime: DateTime

  @column()
  declare ticketsTotal: number

  @column()
  declare ticketsAvailable: number

  @column()
  declare price: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => Venue)
  declare venue: BelongsTo<typeof Venue>

  @belongsTo(() => User, {
    foreignKey: 'createdBy',
  })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => EventStatus, {
    foreignKey: 'statusId',
  })
  declare status: BelongsTo<typeof EventStatus>

  /**
   * Query scope to order events by date in ascending order
   * Usage: Event.query().apply(scopes => scopes.orderByDate())
   */
  static orderByDate = scope((query) => {
    query.orderBy('datetime', 'asc')
  })
}
