import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketStatus extends BaseModel {
  public static table = 'ticket_statuses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string
}
