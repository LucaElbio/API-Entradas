import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Rutas de eventos
router
  .group(() => {
    router
      .group(() => {
        router.get('/', '#controllers/Http/events_controller.index')
        router.get('/:id', '#controllers/Http/events_controller.show')
      })
      .prefix('/events')

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
        router.get('/', '#controllers/tickets_controller.index')
        router.get('/:id', '#controllers/tickets_controller.show')
        router.post('/verify', '#controllers/tickets_controller.verify')
        router.post('/:id/use', '#controllers/tickets_controller.use')
        router.get('/mine', '#controllers/Http/tickets_controller.mine')
        router.post('/:id/transfer', '#controllers/Http/tickets_controller.transfer')
        router.post('/:id/transfer/accept', '#controllers/Http/tickets_controller.acceptTransfer')
        router.post('/:id/transfer/reject', '#controllers/Http/tickets_controller.rejectTransfer')
      
        // BE-Endpoint POST /tickets/pay - Process payment and generate tickets
        router.post('/pay', '#controllers/payments_controller.pay')
      })
      .prefix('/tickets')
      .use(middleware.auth())
      .use(middleware.rateLimit())
  
    
    router
      .group(() => {
        // Reservations endpoints
        router.post('/', '#controllers/reservations_controller.create')
        router.get('/', '#controllers/reservations_controller.index')
        router.get('/:id', '#controllers/reservations_controller.show')
        router.delete('/:id', '#controllers/reservations_controller.cancel')
      })
      .prefix('/reservations')
  })
  .prefix('/api')