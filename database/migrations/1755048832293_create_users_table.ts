import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('username').notNullable()
      table.string('email').unique().notNullable()
      table.string('password').notNullable()
      table.timestamps(true) // crea created_at y updated_at automáticamente
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
