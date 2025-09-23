import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Rutas de eventos
router.group(() => {
  router
    .group(() => {
      router.get('/', '#controllers/Http/events_controller.index')
      router.get('/:id', '#controllers/Http/events_controller.show')
    })
    .prefix('/events')
})

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
      .prefix('/auth')
  })
  .prefix('/auth')
  .use(middleware.rateLimit())
  .prefix('/api')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
