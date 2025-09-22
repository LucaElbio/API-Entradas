import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST', '127.0.0.1'),
        port: Number(env.get('DB_PORT', '3306')),
        user: env.get('DB_USER', 'root'),
        password: env.get('DB_PASSWORD', ''),
        database: env.get('DB_DATABASE', 'apientradas'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
