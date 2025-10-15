import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TransferStatus extends BaseModel {
  public static table = 'transfer_statuses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string
}
