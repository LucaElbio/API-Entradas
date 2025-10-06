# Implementación de HU: Completar Pago

## Resumen
Se ha implementado la funcionalidad completa para procesar pagos de entradas según la Historia de Usuario "Completar pago".

## Tarea Implementada: BE-Endpoint POST /tickets/pay

### 📋 Descripción
Endpoint que permite completar el pago de una reserva y generar automáticamente los tickets con códigos QR.

### 🔗 Endpoint
```
POST /tickets/pay
```
**Autenticación requerida:** Sí (middleware auth)

### 📥 Request Body
```json
{
  "reservation_id": 123
}
```

### 📤 Response (Éxito - 200)
```json
{
  "message": "Pago procesado exitosamente",
  "data": {
    "reservation": {
      "id": 123,
      "status": "PAID",
      "quantity": 2,
      "totalAmount": 5000
    },
    "payment": {
      "id": 456,
      "status": "APPROVED",
      "amount": 5000,
      "provider": "SIMULATED_GATEWAY",
      "externalRef": "PAY-1234567890-123"
    },
    "tickets": [
      {
        "id": 1,
        "qrCode": "1-10-5-uuid-xxx",
        "qrImageUrl": "data:image/png;base64,...",
        "status": "ACTIVE"
      },
      {
        "id": 2,
        "qrCode": "2-10-5-uuid-yyy",
        "qrImageUrl": "data:image/png;base64,...",
        "status": "ACTIVE"
      }
    ]
  }
}
```

### ❌ Responses (Error)

#### 400 - Validación
```json
{
  "error": "Validation failed",
  "message": "El campo reservation_id es requerido"
}
```

#### 400 - Estado inválido
```json
{
  "error": "Invalid reservation status",
  "message": "La reserva no está en estado pendiente"
}
```

#### 400 - Reserva expirada
```json
{
  "error": "Reservation expired",
  "message": "La reserva ha expirado"
}
```

#### 404 - No encontrada
```json
{
  "error": "Not found",
  "message": "Reserva no encontrada"
}
```

## 🏗️ Arquitectura Implementada

### 1. Modelos Creados
- ✅ `EventStatus` - Estados de eventos
- ✅ `ReservationStatus` - Estados de reservas (PENDING, PAID, EXPIRED, CANCELLED)
- ✅ `PaymentStatus` - Estados de pagos (PENDING, APPROVED, REJECTED, REFUNDED)
- ✅ `TicketStatus` - Estados de tickets (ACTIVE, USED, CANCELLED, TRANSFERRED)
- ✅ `Venue` - Recintos/lugares
- ✅ `Event` - Eventos
- ✅ `Reservation` - Reservas
- ✅ `Payment` - Pagos
- ✅ `Ticket` - Entradas/tickets

### 2. Migraciones
Todas las migraciones fueron actualizadas con:
- Columnas según el DER
- Relaciones de foreign keys
- Constraints apropiados
- Índices únicos donde corresponde

### 3. Seeders
`status_seeder.ts` - Inserta los estados iniciales en las tablas:
- Event statuses: DRAFT, PUBLISHED, CANCELLED, COMPLETED
- Reservation statuses: PENDING, PAID, EXPIRED, CANCELLED
- Payment statuses: PENDING, APPROVED, REJECTED, REFUNDED
- Ticket statuses: ACTIVE, USED, CANCELLED, TRANSFERRED

### 4. Servicios
`QrService` - Servicio para generación de códigos QR:
- ✅ `generateTicketQR()` - Genera QR único con imagen base64
- ✅ `verifyQRCode()` - Valida formato del código QR
- Formato: `{ticketId}-{eventId}-{userId}-{uuid}`

### 5. Controller
`PaymentsController` - Maneja el flujo de pago:
- ✅ Método `pay()` implementado
- ✅ Validación de reserva existente
- ✅ Validación de estado PENDING
- ✅ Validación de expiración
- ✅ Transacción de base de datos
- ✅ Actualización a estado PAID
- ✅ Creación de registro de pago
- ✅ Generación automática de tickets
- ✅ Generación de códigos QR
- ✅ Rollback automático en caso de error

### 6. Rutas
Ruta agregada en `routes.ts`:
```typescript
router.post('/tickets/pay', '#controllers/payments_controller.pay')
```
- Protegida con middleware de autenticación

## 🔄 Flujo de Proceso

1. **Recepción**: Se recibe `reservation_id` en el request
2. **Validación**: 
   - Reserva existe
   - Estado es PENDING
   - No ha expirado
3. **Actualización**: Cambio de estado a PAID
4. **Registro**: Creación de payment con estado APPROVED
5. **Generación**: Creación de tickets (cantidad según reserva)
6. **QR Codes**: Generación de código QR único para cada ticket
7. **Respuesta**: Retorno de datos completos

## 🔒 Transacciones
Todo el proceso se ejecuta dentro de una transacción de base de datos que garantiza:
- Atomicidad: Todo o nada
- Consistencia: Rollback automático en errores
- Integridad: No quedan estados intermedios

## 📦 Dependencias Utilizadas
- `qrcode` - Generación de códigos QR (ya instalada)
- `@adonisjs/lucid` - ORM y transacciones
- `node:crypto` - Generación de UUIDs

## ✅ Criterios de Aceptación Cumplidos

✅ **Redirigir a pasarela simulada de pago**
- Implementado como pasarela simulada (`SIMULATED_GATEWAY`)

✅ **Registrar el estado del pago como "aprobado"**
- Payment creado con status APPROVED
- Reservation actualizada a PAID

✅ **Generar las entradas con su respectivo código QR**
- Tickets creados automáticamente
- QR codes únicos generados
- Imágenes QR en formato base64

## 🚀 Próximos Pasos Sugeridos
1. Ejecutar migraciones: `node ace migration:run`
2. Ejecutar seeders: `node ace db:seed`
3. Probar el endpoint con Postman/Thunder Client
4. Implementar endpoint para listar tickets del usuario
5. Implementar endpoint para verificar/validar tickets (escaneo QR)
6. Agregar validación de usuario (que sea dueño de la reserva)
7. Implementar frontend para mostrar QR codes

## 📝 Notas Adicionales
- Los QR codes se generan como data URLs (base64) para fácil visualización
- El formato único del QR incluye UUID para evitar duplicados
- Se puede extender para guardar las imágenes QR en storage externo (S3, etc.)
- El provider "SIMULATED_GATEWAY" puede ser reemplazado por integración real (Stripe, MercadoPago, etc.)
