import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Rutas de eventos
router
  .group(() => {
    router.get('/events', '#controllers/Http/events_controller.index')
    router.get('/events/:id', '#controllers/Http/events_controller.show')
  })
  .prefix('/api')

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
  })
  .use(middleware.auth())
