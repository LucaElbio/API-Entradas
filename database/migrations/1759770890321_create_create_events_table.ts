import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('company_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('companies')
        .onDelete('CASCADE')
      table
        .integer('venue_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('venues')
        .onDelete('RESTRICT')
      table
        .integer('created_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .integer('status_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('event_statuses')
        .onDelete('RESTRICT')
      table.string('title', 255).notNullable()
      table.text('description').notNullable()
      table.date('datetime').notNullable()
      table.integer('tickets_total').notNullable()
      table.integer('tickets_available').notNullable()
      table.decimal('price', 10, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
