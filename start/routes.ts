import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Ruta pública de inicio
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Endpoints API según especificación
// BE-endpoints API- Alta de usuarios: POST /usuarios/registro
router.post('/usuarios/registro', '#controllers/users_controller.register')

// BE-endpoints API- validación de credenciales y entrega de token: POST /usuarios/login
// Aplicamos rate limiting solo a las rutas de login para prevenir ataques de fuerza bruta
router
  .group(() => {
    router.post('/usuarios/login', '#controllers/users_controller.login')
  })
  .use(middleware.rateLimit())

// Rutas protegidas (requieren autenticación)
router
  .group(() => {
    router.get('/auth/me', '#controllers/users_controller.me')
    router.post('/auth/logout', '#controllers/users_controller.logout')
    router.post('/auth/refresh', '#controllers/users_controller.refreshToken')

    // Reservations endpoints
    router.post('/reservations', '#controllers/reservations_controller.create')
    router.get('/reservations', '#controllers/reservations_controller.index')
    router.get('/reservations/:id', '#controllers/reservations_controller.show')
    router.delete('/reservations/:id', '#controllers/reservations_controller.cancel')

    // BE-Endpoint POST /tickets/pay - Process payment and generate tickets
    router.post('/tickets/pay', '#controllers/payments_controller.pay')

    // Tickets endpoints
    router.get('/tickets', '#controllers/tickets_controller.index')
    router.get('/tickets/:id', '#controllers/tickets_controller.show')
    router.post('/tickets/verify', '#controllers/tickets_controller.verify')
    router.post('/tickets/:id/use', '#controllers/tickets_controller.use')
  })
  .use(middleware.auth())
