import router from '@adonisjs/core/services/router'

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

router
  .group(() => {
    // router.post('/register', [UsersController, 'register'])
    router.post('/login', 'UsersController.login')
    router.post('/logout', 'UsersController.logout')
  })
  .prefix('/auth')
