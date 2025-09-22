import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Venue from './venue.js'

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'venue_id' })
  declare venueId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column.dateTime()
  declare datetime: DateTime

  @column({ columnName: 'tickets_total' })
  declare ticketsTotal: number

  @column({ columnName: 'tickets_available' })
  declare ticketsAvailable: number

  @column()
  declare price: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companyId',
  })
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => Venue, {
    foreignKey: 'venueId',
  })
  declare venue: BelongsTo<typeof Venue>
}
