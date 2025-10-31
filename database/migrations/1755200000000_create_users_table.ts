import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('company_id').unsigned().nullable()
      table.integer('role_id').unsigned().nullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email').unique().notNullable()
      table.string('dni', 10).unique().notNullable()
      table.string('password').notNullable()
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
