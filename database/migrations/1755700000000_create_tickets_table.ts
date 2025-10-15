import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('event_id').unsigned().references('id').inTable('events').onDelete('CASCADE')
      table.integer('owner_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .bigInteger('status_id')
        .unsigned()
        .references('id')
        .inTable('ticket_statuses')
        .onDelete('RESTRICT')
      table.string('qr_code', 255).notNullable().unique()
      table.string('qr_image_url', 500).nullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
