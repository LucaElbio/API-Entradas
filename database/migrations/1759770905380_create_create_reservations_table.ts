import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reservations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE')
      table.integer('status_id').unsigned().notNullable().references('id').inTable('reservation_statuses').onDelete('RESTRICT')
      table.integer('quantity').notNullable()
      table.decimal('total_amount', 10, 2).notNullable()
      table.string('token', 255).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
