"# API-Entradas

Sistema de gestión de entradas para eventos con reservaciones automáticas.

## 🚀 Características Principales

- ✅ Gestión de usuarios y autenticación JWT
- ✅ Sistema de reservaciones con expiración automática
- ✅ Control de stock en tiempo real
- ✅ Generación de tickets con códigos QR únicos
- ✅ Procesamiento de pagos
- ✅ Envío de emails de confirmación
- ✅ Control de concurrencia y race conditions
- ✅ Expiración automática de reservas no pagadas

## 📋 Requisitos

- Node.js 18+
- MySQL 5.7+ o 8.0+
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/matutecalle/API-Entradas.git
cd API-Entradas

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Configurar base de datos en .env
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=
# DB_DATABASE=api_entradas

# Ejecutar migraciones
node ace migration:run

# Ejecutar seeders
node ace db:seed
```

## 🚀 Iniciar el Servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm run build
npm start
```

El servidor iniciará en `http://localhost:3333`

## 📚 Documentación

- **[Sistema de Reservaciones](RESERVATIONS_SYSTEM.md)** - Documentación técnica completa
- **[Ejemplos de API](RESERVATIONS_API_EXAMPLES.md)** - Ejemplos de uso de todos los endpoints
- **[Resumen de Implementación](IMPLEMENTATION_SUMMARY.md)** - Resumen ejecutivo de funcionalidades
- **[Referencia de Endpoints](API_ENDPOINTS_REFERENCE.md)** - Referencia completa de la API

## 🔑 Endpoints Principales

### Autenticación
- `POST /usuarios/registro` - Registrar nuevo usuario
- `POST /usuarios/login` - Iniciar sesión
- `GET /auth/me` - Obtener usuario autenticado
- `POST /auth/logout` - Cerrar sesión
- `POST /auth/refresh` - Refrescar token

### Reservaciones
- `POST /reservations` - Crear nueva reserva
- `GET /reservations` - Listar mis reservas
- `GET /reservations/:id` - Ver reserva específica
- `DELETE /reservations/:id` - Cancelar reserva

### Pagos y Tickets
- `POST /tickets/pay` - Procesar pago y generar tickets
- `GET /tickets` - Listar mis tickets
- `GET /tickets/:id` - Ver ticket específico
- `POST /tickets/verify` - Verificar validez de un ticket
- `POST /tickets/:id/use` - Usar/marcar ticket como usado

## 🎯 Flujo de Uso

```
1. Usuario se registra/logea → Obtiene token JWT
2. Usuario crea reserva → Stock se descuenta temporalmente
3. Usuario paga dentro de 15 minutos → Tickets generados con QR
4. Si no paga → Reserva expira automáticamente, stock se recupera
```

## ⏰ Sistema de Expiración Automática

El sistema incluye un cron job que se ejecuta cada minuto para:
- Buscar reservas pendientes que expiraron
- Cambiar su estado a EXPIRED
- Devolver tickets al stock del evento

```bash
# Ejecutar manualmente
node ace expire:reservations
```

## 🔧 Comandos Útiles

```bash
# Ver todas las rutas
node ace list:routes

# Ver todos los comandos
node ace list

# Ejecutar migraciones
node ace migration:run

# Revertir migraciones
node ace migration:rollback

# Ejecutar seeders
node ace db:seed

# Verificar tipos TypeScript
npm run typecheck

# Formatear código
npm run format

# Linter
npm run lint
```

## 🏗️ Estructura del Proyecto

```
API-Entradas/
├── app/
│   ├── controllers/        # Controladores de la API
│   │   ├── reservations_controller.ts
│   │   ├── payments_controller.ts
│   │   ├── tickets_controller.ts
│   │   └── users_controller.ts
│   ├── models/            # Modelos de Lucid ORM
│   ├── services/          # Servicios de negocio
│   │   ├── reservation_expiration_service.ts
│   │   ├── qr_service.ts
│   │   └── mail_service.ts
│   ├── middleware/        # Middlewares
│   └── validators/        # Validadores
├── commands/              # Comandos de Ace CLI
│   └── expire_reservations.ts
├── config/               # Configuración de la app
├── database/
│   ├── migrations/       # Migraciones de BD
│   └── seeders/          # Seeders
├── start/
│   ├── routes.ts         # Definición de rutas
│   ├── kernel.ts         # Configuración de middleware
│   └── cron.ts           # Configuración de cron jobs
└── bin/
    └── server.ts         # Punto de entrada
```

## 🔐 Seguridad

- Autenticación con JWT
- Hash de contraseñas con bcrypt
- Rate limiting en endpoints críticos
- CORS configurado
- Validación de datos con VineJS
- Middleware de autenticación
- Control de roles y permisos

## 🛡️ Control de Concurrencia

El sistema implementa:
- Transacciones de base de datos
- Row locking (`forUpdate()`)
- Validaciones atómicas
- Rollback automático en errores

Esto garantiza que no se produzca overselling de tickets.

## 📧 Configuración de Email

Para enviar emails de confirmación, configura en `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicación
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📦 Producción

```bash
# Compilar para producción
npm run build

# Iniciar en producción
npm start
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y no tiene licencia pública.

## 👥 Autores

- [@matutecalle](https://github.com/matutecalle)

## 🙏 Agradecimientos

- AdonisJS por el excelente framework
- Lucid ORM por la gestión de base de datos
- node-cron por el sistema de tareas programadas"
