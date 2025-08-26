import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('MYSQL_HOST', '127.0.0.1'),
        port: env.get('MYSQL_PORT', '3306'),
        user: env.get('MYSQL_USER', 'root'),
        password: env.get('MYSQL_PASSWORD', '1234'),
        database: env.get('MYSQL_DB_NAME', 'APIEntradas'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
