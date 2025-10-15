import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_statuses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('code', 50).notNullable().unique()
      table.string('name', 100).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
