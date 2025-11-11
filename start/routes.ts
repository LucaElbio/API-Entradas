import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router
  .group(() => {
    // Eventos - públicos
    router
      .group(() => {
        router.get('/', '#controllers/Http/events_controller.index')
        router.get('/:id', '#controllers/Http/events_controller.show')
      })
      .prefix('/events')

    // Eventos - protegidos
    router
      .group(() => {
        router.post('/', '#controllers/Http/events_controller.create')
        router.put('/:id', '#controllers/Http/events_controller.update')
        router.delete('/:id', '#controllers/Http/events_controller.destroy')
      })
      .prefix('/events')
      .use(middleware.auth())

    // Venues - públicos
    router
      .group(() => {
        router.get('/', '#controllers/Http/venues_controller.index')
        router.get('/:id', '#controllers/Http/venues_controller.show')
      })
      .prefix('/venues')

    // Venues - protegidos
    router
      .group(() => {
        router.post('/', '#controllers/Http/venues_controller.create')
        router.put('/:id', '#controllers/Http/venues_controller.update')
        router.delete('/:id', '#controllers/Http/venues_controller.destroy')
      })
      .prefix('/venues')
      .use(middleware.auth())

    router
      .group(() => {
        router.post('/register', '#controllers/Http/users_controller.register')
        router.post('/login', '#controllers/Http/users_controller.login')

        // Rutas protegidas (requieren autenticación)
        router
          .group(() => {
            router.get('/me', '#controllers/Http/users_controller.me')
            router.post('/logout', '#controllers/Http/users_controller.logout')
            router.post('/refresh', '#controllers/Http/users_controller.refreshToken')
          })
          .use(middleware.auth())
      })
      .prefix('/auth')
      .use(middleware.rateLimit())

    // Rutas de tickets (requieren autenticación)
    router
      .group(() => {
        // Rutas específicas PRIMERO
        router.get('/mine', '#controllers/Http/tickets_controller.mine')
        router.get('/transfers/pending', '#controllers/Http/tickets_controller.pendingTransfers')
        router.post('/verify', '#controllers/Http/tickets_controller.verify')
        router.post('/pay', '#controllers/Http/payments_controller.pay')

        // Rutas con parámetros DESPUÉS
        router.get('/', '#controllers/Http/tickets_controller.index')
        router.get('/:id', '#controllers/Http/tickets_controller.show')
        router.post('/:id/use', '#controllers/Http/tickets_controller.use')
        router.post('/:id/transfer', '#controllers/Http/tickets_controller.transfer')
        router.post('/:id/transfer/accept', '#controllers/Http/tickets_controller.acceptTransfer')
        router.post('/:id/transfer/reject', '#controllers/Http/tickets_controller.rejectTransfer')
      })
      .prefix('/tickets')
      .use(middleware.auth())
      .use(middleware.rateLimit())

    router
      .group(() => {
        // Reservations endpoints
        router.post('/', '#controllers/Http/reservations_controller.create')
        router.get('/', '#controllers/Http/reservations_controller.index')
        router.get('/:id', '#controllers/Http/reservations_controller.show')
        router.delete('/:id', '#controllers/Http/reservations_controller.cancel')
      })
      .prefix('/reservations')
  })
  .prefix('/api')
