declare module '@adonisjs/core/services/hash' {
  const hash: {
    make: (value: string) => Promise<string>
    use: (driver: string) => any
  }
  export default hash
}

declare module '#controllers/Http/events_controller' {
  import EventsController from '../app/controllers/Http/events_controller.js'
  export default EventsController
}

declare module '#controllers/Http/users_controller' {
  import UsersController from '../app/controllers/Http/users_controller.js'
  export default UsersController
}