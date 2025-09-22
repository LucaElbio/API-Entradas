import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Event from './event.js'

export default class Venue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column()
  declare name: string

  @column()
  declare address: string

  @column()
  declare capacity: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Company, {
    foreignKey: 'companyId',
  })
  declare company: BelongsTo<typeof Company>

  @hasMany(() => Event, {
    foreignKey: 'venueId',
  })
  declare events: HasMany<typeof Event>
}
