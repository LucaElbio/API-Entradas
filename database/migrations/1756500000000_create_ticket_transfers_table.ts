import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ticket_transfers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('ticket_id').unsigned().references('id').inTable('tickets').onDelete('CASCADE')
      table.integer('from_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('to_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('status_id')
        .unsigned()
        .references('id')
        .inTable('transfer_statuses')
        .onDelete('RESTRICT')
      table.string('receiver_contact', 255).nullable()
      table.string('receiver_type', 50).nullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('responded_at').nullable()
      table.string('old_qr', 255).nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
