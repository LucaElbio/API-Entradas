import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE')
      table.integer('reservation_id').unsigned().notNullable().references('id').inTable('reservations').onDelete('CASCADE')
      table.integer('owner_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('status_id').unsigned().notNullable().references('id').inTable('ticket_statuses').onDelete('RESTRICT')
      table.string('qr_code', 255).notNullable().unique()
      table.string('qr_image_url', 500).nullable()
      table.timestamp('used_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
