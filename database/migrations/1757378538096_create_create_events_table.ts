import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('company_id')
        .unsigned()
        .references('id')
        .inTable('companies')
        .onDelete('CASCADE')
      table.bigInteger('venue_id').unsigned().references('id').inTable('venues').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.dateTime('datetime').notNullable()
      table.integer('tickets_total').notNullable()
      table.integer('tickets_available').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.timestamps(true, true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
