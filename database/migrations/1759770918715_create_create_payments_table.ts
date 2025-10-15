import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('reservation_id').unsigned().notNullable().references('id').inTable('reservations').onDelete('CASCADE')
      table.integer('status_id').unsigned().notNullable().references('id').inTable('payment_statuses').onDelete('RESTRICT')
      table.decimal('amount', 10, 2).notNullable()
      table.string('provider', 100).notNullable()
      table.string('external_ref', 255).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
