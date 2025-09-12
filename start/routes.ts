import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Ruta pública de inicio
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Rutas de autenticación públicas
router.post('/auth/register', '#controllers/users_controller.register')
router.post('/auth/login', '#controllers/users_controller.login')

// Nuevos endpoints API según especificación
// BE-endpoints API- Alta de usuarios: POST /usuarios/registro
router.post('/usuarios/registro', '#controllers/users_controller.register') // Mismo controlador, ruta diferente

// BE-endpoints API- validación de credenciales y entrega de token: POST /usuarios/login
router.post('/usuarios/login', '#controllers/users_controller.login') // Endpoint específico para login

// Rutas protegidas (requieren autenticación)
router
  .group(() => {
    router.get('/auth/me', '#controllers/users_controller.me')
    router.post('/auth/logout', '#controllers/users_controller.logout')
  })
  .use(middleware.auth())
