/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  HOST: Env.schema.string.optional({ format: 'host' }),
  PORT: Env.schema.number.optional(),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  APP_KEY: Env.schema.string(),
  LOG_LEVEL: Env.schema.enum.optional([
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
  ]),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring email (SMTP)
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),
})
