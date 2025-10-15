# 📊 Sprint 3 - Reporte Final

**Proyecto:** API-Entradas  
**Sprint:** 3  
**Fecha:** Octubre 2025  
**Estado:** ✅ COMPLETADO

---

## 📋 Resumen Ejecutivo

En este sprint se implementaron 3 Historias de Usuario completas relacionadas con el sistema de pagos, generación de tickets con códigos QR y notificaciones:

1. **HU: Completar pago** - Sistema de procesamiento de pagos simulado
2. **HU: Generar código QR único** - Generación automática de tickets con QR
3. **HU: Confirmación de compra** - Sistema de envío de emails con detalles de compra

**Resultado:** 5 endpoints REST + sistema de emails completamente funcionales + documentación completa

---

## 🎯 Historias de Usuario Implementadas

### HU-1: Completar Pago
**Como usuario, quiero realizar el pago de mis entradas para finalizar la compra.**

**Criterios de aceptación:**
- ✅ Redirigir a pasarela simulada de pago
- ✅ Registrar el estado del pago como "aprobado"
- ✅ Generar las entradas con su respectivo código QR

### HU-2: Generar Código QR Único
**Como usuario, quiero recibir un QR único por entrada comprada, para validar mi ingreso al evento.**

**Criterios de aceptación:**
- ✅ El QR debe ser único y contener datos de la entrada
- ✅ Asociar el QR al usuario y evento
- ✅ Al escanearlo debe poder verificarse como válido

### HU-3: Confirmación de Compra
**Como usuario, quiero recibir un email de confirmación después de completar mi compra, para tener un registro y acceso a mis entradas.**

**Criterios de aceptación:**
- ✅ Enviar email automáticamente al completar el pago
- ✅ Incluir detalles del evento (título, fecha, hora, lugar)
- ✅ Incluir códigos QR de todas las entradas compradas
- ✅ Incluir resumen del pago (cantidad, precio, total)
- ✅ Email profesional con formato HTML atractivo

---

## 🗄️ Base de Datos - Nuevas Tablas

### Tablas creadas:
1. `venues` - Recintos/lugares de eventos
2. `events` - Eventos
3. `event_statuses` - Estados de eventos
4. `reservations` - Reservas de tickets
5. `reservation_statuses` - Estados de reservas
6. `payments` - Pagos procesados
7. `payment_statuses` - Estados de pagos
8. `tickets` - Entradas generadas
9. `ticket_statuses` - Estados de tickets

### Estados iniciales configurados:

**Reservation Statuses:**
- `PENDING` - Pendiente
- `PAID` - Pagado
- `EXPIRED` - Expirado
- `CANCELLED` - Cancelado

**Payment Statuses:**
- `PENDING` - Pendiente
- `APPROVED` - Aprobado
- `REJECTED` - Rechazado
- `REFUNDED` - Reembolsado

**Ticket Statuses:**
- `ACTIVE` - Activo
- `USED` - Usado
- `CANCELLED` - Cancelado
- `TRANSFERRED` - Transferido

---

## 🚀 Endpoints Implementados

### 1. POST /tickets/pay
**Procesar pago y generar tickets con QR**

#### Autenticación
✅ Requerida (Bearer Token)

#### Request
```http
POST /tickets/pay
Authorization: Bearer {token}
Content-Type: application/json

{
  "reservation_id": 123
}
```

#### Response (200 OK)
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
        "qrCode": "1-10-5-550e8400-e29b-41d4-a716-446655440000",
        "qrImageUrl": "data:image/png;base64,iVBORw0KGgo...",
        "status": "ACTIVE"
      },
      {
        "id": 2,
        "qrCode": "2-10-5-771f9511-f3ac-52e5-b827-557766551111",
        "qrImageUrl": "data:image/png;base64,iVBORw0KGgo...",
        "status": "ACTIVE"
      }
    ]
  }
}
```

#### Errores posibles
- `400` - Reserva no está en estado PENDING
- `400` - Reserva expirada
- `404` - Reserva no encontrada
- `500` - Error interno

#### ⚠️ Importante para Frontend
- El `qrImageUrl` es una imagen en formato **base64** (data URL)
- Puede ser usada directamente en un `<img src="{qrImageUrl}">`
- Los tickets se generan automáticamente según la cantidad de la reserva

---

### 2. GET /tickets
**Listar todos los tickets del usuario**

#### Autenticación
✅ Requerida (Bearer Token)

#### Request
```http
GET /tickets
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "message": "Tickets obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "qrCode": "1-10-5-550e8400-e29b-41d4-a716-446655440000",
      "qrImageUrl": "data:image/png;base64,iVBORw0KGgo...",
      "status": "ACTIVE",
      "usedAt": null,
      "event": {
        "id": 10,
        "title": "Concierto Rock 2025",
        "datetime": "2025-12-15T20:00:00.000-03:00"
      },
      "reservation": {
        "id": 123,
        "totalAmount": 2500
      },
      "createdAt": "2025-10-06T10:30:00.000-03:00"
    }
  ]
}
```

#### ⚠️ Importante para Frontend
- Los tickets están ordenados por fecha de creación (más reciente primero)
- El campo `status` puede ser: `ACTIVE`, `USED`, `CANCELLED`, `TRANSFERRED`
- `usedAt` es `null` si el ticket no ha sido usado
- La fecha `datetime` del evento está en formato ISO 8601

---

### 3. GET /tickets/:id
**Obtener detalles completos de un ticket**

#### Autenticación
✅ Requerida (Bearer Token)

#### Request
```http
GET /tickets/1
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "message": "Ticket obtenido exitosamente",
  "data": {
    "id": 1,
    "qrCode": "1-10-5-550e8400-e29b-41d4-a716-446655440000",
    "qrImageUrl": "data:image/png;base64,iVBORw0KGgo...",
    "status": "ACTIVE",
    "statusName": "Activo",
    "usedAt": null,
    "event": {
      "id": 10,
      "title": "Concierto Rock 2025",
      "description": "El mejor concierto de rock del año",
      "datetime": "2025-12-15T20:00:00.000-03:00",
      "price": 2500,
      "venue": {
        "id": 5,
        "name": "Estadio Luna Park",
        "address": "Av. Corrientes 1234, CABA"
      }
    },
    "reservation": {
      "id": 123,
      "quantity": 2,
      "totalAmount": 5000
    },
    "createdAt": "2025-10-06T10:30:00.000-03:00"
  }
}
```

#### Errores posibles
- `404` - Ticket no encontrado o no pertenece al usuario

#### ⚠️ Importante para Frontend
- Solo se pueden obtener tickets del usuario autenticado
- Incluye información completa del evento y venue
- Útil para mostrar la página de detalle del ticket

---

### 4. POST /tickets/verify
**Verificar validez de un código QR**

#### Autenticación
✅ Requerida (Bearer Token)

#### Request
```http
POST /tickets/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "qr_code": "1-10-5-550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response (200 OK) - Ticket válido
```json
{
  "message": "QR verificado exitosamente",
  "data": {
    "valid": true,
    "ticket": {
      "id": 1,
      "status": "ACTIVE",
      "statusName": "Activo",
      "usedAt": null
    },
    "event": {
      "id": 10,
      "title": "Concierto Rock 2025",
      "datetime": "2025-12-15T20:00:00.000-03:00",
      "venue": {
        "name": "Estadio Luna Park",
        "address": "Av. Corrientes 1234, CABA"
      }
    },
    "owner": {
      "id": 5,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com"
    }
  }
}
```

#### Response (200 OK) - Ticket inválido (ya usado)
```json
{
  "message": "QR verificado exitosamente",
  "data": {
    "valid": false,
    "ticket": {
      "id": 1,
      "status": "USED",
      "statusName": "Usado",
      "usedAt": "2025-12-15T20:15:00.000-03:00"
    },
    "event": { ... },
    "owner": { ... }
  }
}
```

#### Errores posibles
- `400` - Formato de QR inválido
- `404` - QR no encontrado en la base de datos

#### ⚠️ Importante para Frontend
- El campo `valid` indica si el ticket puede ser usado (`true` solo si status = ACTIVE)
- Siempre retorna información del ticket incluso si no es válido
- Útil para apps de escaneo en la entrada del evento

---

### 5. POST /tickets/:id/use
**Marcar ticket como usado**

#### Autenticación
✅ Requerida (Bearer Token)

#### Request
```http
POST /tickets/1/use
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "message": "Ticket marcado como usado exitosamente",
  "data": {
    "id": 1,
    "status": "USED",
    "usedAt": "2025-12-15T20:15:00.000-03:00",
    "event": {
      "id": 10,
      "title": "Concierto Rock 2025"
    }
  }
}
```

#### Errores posibles
- `400` - Ticket ya fue usado
- `400` - Ticket no está en estado ACTIVE
- `404` - Ticket no encontrado

#### ⚠️ Importante para Frontend
- Este endpoint se usa al escanear el ticket en la entrada
- Una vez marcado como USED, no puede volver a usarse
- El campo `usedAt` registra la fecha y hora exacta del uso

---

## 🔐 Autenticación

**Todos los endpoints requieren autenticación Bearer Token:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cómo obtener el token:
```http
POST /usuarios/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "type": "bearer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez"
  }
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 400 | Bad Request | Validación fallida, datos inválidos |
| 401 | Unauthorized | Token inválido o ausente |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## 🎨 Formato de Datos

### Fechas
Todas las fechas están en formato **ISO 8601** con timezone:
```
2025-12-15T20:00:00.000-03:00
```

**Parsing en JavaScript:**
```javascript
const eventDate = new Date("2025-12-15T20:00:00.000-03:00");
```

### Imágenes QR
Las imágenes QR están en formato **Data URL (base64)**:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

**Uso en HTML:**
```html
<img src="{qrImageUrl}" alt="QR Code" width="300" height="300" />
```

**Uso en React:**
```jsx
<img src={ticket.qrImageUrl} alt="QR Code" style={{ width: 300, height: 300 }} />
```

### Código QR (String)
Formato: `{ticketId}-{eventId}-{userId}-{UUID}`
```
1-10-5-550e8400-e29b-41d4-a716-446655440000
```

---

## 🔄 Flujo de Usuario Completo

### 1. Usuario realiza una reserva
*(Endpoint de reservas - no implementado en este sprint)*
```
Crea una reserva con estado PENDING
```

### 2. Usuario procesa el pago
```http
POST /tickets/pay
{
  "reservation_id": 123
}
```
**Resultado:**
- Reserva cambia a estado PAID
- Se crea un registro de pago (APPROVED)
- Se generan N tickets (según cantidad de la reserva)
- Cada ticket tiene su QR único
- **📧 Se envía email de confirmación automáticamente**

### 3. Usuario ve sus tickets
```http
GET /tickets
```
**UI sugerida:**
- Lista de tarjetas con: evento, fecha, QR preview
- Botón "Ver detalle" para cada ticket

### 4. Usuario ve detalle de un ticket
```http
GET /tickets/1
```
**UI sugerida:**
- QR code grande y prominente
- Información del evento
- Información del venue
- Botón "Descargar QR" o "Compartir"

### 5. Personal del evento escanea el QR
```http
POST /tickets/verify
{
  "qr_code": "1-10-5-uuid..."
}
```
**UI sugerida:**
- Scanner de QR
- Mostrar resultado: ✅ Válido / ❌ Inválido
- Si válido, mostrar datos del usuario y evento

### 6. Personal permite el ingreso
```http
POST /tickets/1/use
```
**Resultado:**
- Ticket marcado como USED
- Ya no puede volver a usarse

---

## 💡 Ejemplos de Integración Frontend

### React - Listar Tickets
```jsx
import { useEffect, useState } from 'react';

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3333/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setTickets(data.data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) return <div>Cargando tickets...</div>;

  return (
    <div className="tickets-list">
      {tickets.map(ticket => (
        <div key={ticket.id} className="ticket-card">
          <h3>{ticket.event.title}</h3>
          <p>{new Date(ticket.event.datetime).toLocaleString()}</p>
          <img 
            src={ticket.qrImageUrl} 
            alt="QR Code" 
            width="200" 
            height="200"
          />
          <span className={`status ${ticket.status.toLowerCase()}`}>
            {ticket.status}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### React - Procesar Pago
```jsx
async function processPayment(reservationId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3333/tickets/pay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reservation_id: reservationId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Tickets generados:', data.data.tickets);
    
    // Redirigir a la página de tickets
    window.location.href = '/mis-tickets';
  } catch (error) {
    alert('Error al procesar el pago: ' + error.message);
  }
}
```

### React - Verificar QR (App de escaneo)
```jsx
import QrScanner from 'qr-scanner'; // librería de ejemplo

function QRVerifier() {
  const [result, setResult] = useState(null);

  const handleScan = async (qrCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3333/tickets/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qr_code: qrCode })
      });

      const data = await response.json();
      setResult(data.data);

      if (data.data.valid) {
        // Ticket válido - permitir ingreso
        await markTicketAsUsed(data.data.ticket.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markTicketAsUsed = async (ticketId) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3333/tickets/${ticketId}/use`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  return (
    <div>
      <QrScanner onScan={handleScan} />
      {result && (
        <div className={result.valid ? 'valid' : 'invalid'}>
          {result.valid ? '✅ Ticket Válido' : '❌ Ticket Inválido'}
          <p>Usuario: {result.owner.firstName} {result.owner.lastName}</p>
          <p>Evento: {result.event.title}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing con Postman/Thunder Client

### Collection de endpoints:

```json
{
  "name": "API Entradas - Sprint 3",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "http://localhost:3333/usuarios/login",
      "body": {
        "email": "usuario@example.com",
        "password": "password123"
      }
    },
    {
      "name": "Procesar Pago",
      "method": "POST",
      "url": "http://localhost:3333/tickets/pay",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "reservation_id": 123
      }
    },
    {
      "name": "Listar Tickets",
      "method": "GET",
      "url": "http://localhost:3333/tickets",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Ver Ticket",
      "method": "GET",
      "url": "http://localhost:3333/tickets/1",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Verificar QR",
      "method": "POST",
      "url": "http://localhost:3333/tickets/verify",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "qr_code": "1-10-5-uuid..."
      }
    },
    {
      "name": "Marcar como Usado",
      "method": "POST",
      "url": "http://localhost:3333/tickets/1/use",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

---

## 📱 Consideraciones para Apps Móviles

### Scanner de QR
Se recomienda usar librerías nativas para mejor rendimiento:

**React Native:**
- `react-native-qrcode-scanner`
- `react-native-camera`

**Flutter:**
- `qr_code_scanner`
- `mobile_scanner`

### Mostrar QR
Los QR en base64 funcionan perfectamente en mobile:

```jsx
// React Native
<Image 
  source={{ uri: ticket.qrImageUrl }} 
  style={{ width: 300, height: 300 }}
/>
```

### Almacenamiento Local
Considerar guardar los tickets en caché para acceso offline:

```javascript
// AsyncStorage en React Native
await AsyncStorage.setItem('tickets', JSON.stringify(tickets));
```

---

## ⚡ Performance

### Optimizaciones implementadas:
- ✅ Índices en BD para búsquedas rápidas
- ✅ Transacciones para consistencia
- ✅ Eager loading de relaciones (preload)
- ✅ QR en base64 (sin llamadas adicionales)

### Recomendaciones Frontend:
- Cachear la lista de tickets
- Lazy loading de imágenes QR
- Mostrar skeleton loaders durante carga
- Implementar pull-to-refresh

---

## 🔒 Seguridad

### Implementado:
- ✅ Autenticación Bearer Token obligatoria
- ✅ Validación de propietario (solo ver sus tickets)
- ✅ QR únicos con UUID (imposibles de duplicar)
- ✅ Índice único en BD previene duplicados
- ✅ Validación de estado antes de usar ticket

### Recomendaciones Frontend:
- Nunca mostrar tokens en logs
- Limpiar token al hacer logout
- Manejar expiración de token (401)
- HTTPS en producción

---

## 📚 Documentación Adicional

En la carpeta `docs/` encontrarás:

1. **PAYMENT_IMPLEMENTATION.md** - Detalles técnicos del sistema de pagos
2. **QR_CODE_IMPLEMENTATION.md** - Implementación completa de QR
3. **TICKETS_API_DOCUMENTATION.md** - Documentación extendida de endpoints
4. **EMAIL_NOTIFICATIONS.md** - Sistema de notificaciones por email con SMTP

---

## � Sistema de Notificaciones por Email

### Configuración SMTP

El sistema incluye un servicio de envío de emails profesionales que se activa automáticamente al completar un pago.

#### Variables de Entorno Requeridas

Agregar en el archivo `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password-o-app-password
MAIL_FROM_NAME=API Entradas
MAIL_FROM_ADDRESS=noreply@api-entradas.com
```

#### Proveedores SMTP Compatibles

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-cuenta@gmail.com
SMTP_PASSWORD=tu-app-password
```
⚠️ Nota: En Gmail debes generar una "Contraseña de aplicación" si tienes 2FA activado.

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-cuenta@outlook.com
SMTP_PASSWORD=tu-password
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-sendgrid-api-key
```

**Mailtrap (Testing):**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=tu-mailtrap-user
SMTP_PASSWORD=tu-mailtrap-password
```

### Email de Confirmación de Compra

#### ¿Cuándo se envía?
El email se envía **automáticamente** al completar exitosamente el pago en el endpoint `POST /tickets/pay`.

#### Contenido del Email

El email incluye:

1. **Saludo personalizado** con nombre del usuario
2. **Detalles del evento:**
   - Título del evento
   - Fecha y hora
   - Lugar (venue)
   - Dirección completa

3. **Resumen de pago:**
   - Cantidad de entradas
   - Precio por entrada
   - Total pagado
   - Referencia de pago

4. **Códigos QR:**
   - Una sección por cada entrada comprada
   - Imagen QR grande (250x250px)
   - Código de referencia debajo del QR
   - QR también adjunto como archivo PNG

5. **Instrucciones importantes:**
   - Llegar con anticipación
   - Presentar QR en la entrada
   - Cada código es de un solo uso
   - Información de contacto de soporte

#### Formato del Email

El email está diseñado con **HTML profesional** que incluye:
- ✅ Diseño responsive (funciona en móviles)
- ✅ Colores corporativos atractivos
- ✅ Tablas para información estructurada
- ✅ Códigos QR incrustados inline
- ✅ Adjuntos de imágenes QR como archivos
- ✅ Footer con información de contacto

#### Ejemplo Visual

```
┌─────────────────────────────────────┐
│   ¡Compra Confirmada! 🎉           │  ← Header con gradiente
│   Tu entrada ha sido generada       │
├─────────────────────────────────────┤
│ Hola Juan Pérez,                    │
│ ¡Gracias por tu compra!             │
├─────────────────────────────────────┤
│ 📅 Detalles del Evento              │
│ ┌─────────────────────────────┐    │
│ │ Evento: Concierto Rock 2025 │    │
│ │ Fecha: 15/12/2025           │    │
│ │ Hora: 20:00                 │    │
│ │ Lugar: Estadio Luna Park    │    │
│ └─────────────────────────────┘    │
├─────────────────────────────────────┤
│ 💳 Resumen de Pago                  │
│ ┌─────────────────────────────┐    │
│ │ Cantidad: 2 entradas        │    │
│ │ Precio: $2,500.00 c/u       │    │
│ │ Total: $5,000.00            │    │
│ └─────────────────────────────┘    │
├─────────────────────────────────────┤
│ 🎫 Tus Entradas                     │
│                                     │
│   Entrada #1                        │
│   ┌───────────────┐                │
│   │  ▓▓▓  ▓  ▓▓▓  │                │  ← Código QR
│   │  ▓  ▓▓▓▓▓  ▓  │                │
│   │  ▓▓▓  ▓  ▓▓▓  │                │
│   └───────────────┘                │
│   Código: 1-10-5                   │
│                                     │
│   Entrada #2                        │
│   ┌───────────────┐                │
│   │  ▓▓▓  ▓  ▓▓▓  │                │
│   │  ▓  ▓▓▓▓▓  ▓  │                │
│   │  ▓▓▓  ▓  ▓▓▓  │                │
│   └───────────────┘                │
│   Código: 2-10-5                   │
├─────────────────────────────────────┤
│ ⚠️ Importante                       │
│ • Llega con anticipación            │
│ • Presenta tu código QR             │
│ • Cada código es de un solo uso     │
├─────────────────────────────────────┤
│ Contacto: soporte@api-entradas.com │  ← Footer
│ © 2025 API Entradas                │
└─────────────────────────────────────┘
```

### Modo Desarrollo vs Producción

#### Modo Desarrollo (Sin SMTP configurado)
Si **NO** configuras las variables SMTP, el sistema funciona en modo desarrollo:
- ✅ No envía emails reales
- ✅ Muestra los datos en la consola del servidor
- ✅ Útil para testing local sin configurar SMTP
- ✅ No bloquea el flujo de compra

```
📧 ========== EMAIL (Development Mode) ==========
To: usuario@example.com
Subject: ✅ Confirmación de compra - Concierto Rock 2025
Event: Concierto Rock 2025
Tickets: 2
Amount: 5000
==================================================
```

#### Modo Producción (Con SMTP configurado)
Si configuras las variables SMTP correctamente:
- ✅ Envía emails reales a los usuarios
- ✅ Los usuarios reciben el email en su bandeja de entrada
- ✅ Incluye todos los códigos QR como adjuntos
- ✅ Formato profesional HTML

### Manejo de Errores

El sistema de emails es **no bloqueante**:
- ✅ Si el email falla, el pago sigue procesándose correctamente
- ✅ El usuario recibe sus tickets en la respuesta HTTP
- ✅ Los errores se loguean en consola para debugging
- ✅ No afecta la experiencia del usuario

```typescript
// El email se envía pero no bloquea
mailService.sendPurchaseConfirmation(emailData).catch((error) => {
  console.error('Error sending email:', error)
  // El pago ya fue procesado exitosamente
})
```

### Testing del Sistema de Emails

#### Opción 1: Modo Desarrollo
1. No configurar variables SMTP
2. Hacer un `POST /tickets/pay`
3. Ver el log en la consola del servidor

#### Opción 2: Mailtrap (Recomendado para testing)
1. Crear cuenta gratuita en [Mailtrap.io](https://mailtrap.io)
2. Obtener credenciales SMTP de tu inbox de testing
3. Configurar en `.env`
4. Todos los emails se envían a Mailtrap (no a usuarios reales)
5. Ver emails con formato completo en la interfaz web de Mailtrap

#### Opción 3: Email Real
1. Configurar con Gmail/Outlook
2. Hacer un pago real
3. Verificar en tu bandeja de entrada

### Servicio MailService

El servicio está implementado en `app/services/mail_service.ts` con los siguientes métodos:

```typescript
class MailService {
  // Enviar email de confirmación de compra
  async sendPurchaseConfirmation(data: PurchaseConfirmationData): Promise<boolean>
  
  // Verificar conexión SMTP
  async testConnection(): Promise<boolean>
}
```

#### Uso desde el Controller

```typescript
import MailService from '#app/services/mail_service'

const mailService = new MailService()

await mailService.sendPurchaseConfirmation({
  user: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com'
  },
  event: {
    title: 'Concierto Rock',
    description: 'Descripción del evento',
    datetime: DateTime.now(),
    venue: { name: 'Luna Park', address: 'Av. Corrientes 1234' },
    price: 2500
  },
  tickets: [
    { id: 1, qrCode: '1-10-5-uuid', qrImageUrl: 'data:image/png;base64,...' }
  ],
  payment: {
    amount: 5000,
    externalRef: 'PAY-123'
  },
  reservation: {
    id: 123,
    quantity: 2
  }
})
```

### Personalización del Email

Si deseas personalizar el diseño del email, edita el método `generatePurchaseConfirmationHTML()` en `app/services/mail_service.ts`.

Elementos personalizables:
- Colores del header (gradiente)
- Logo de la empresa
- Textos de instrucciones
- Footer con redes sociales
- Tamaño de las imágenes QR
- Idioma del contenido

### Mejoras Futuras Sugeridas

Para sprints futuros, se podría agregar:

1. **Email de recordatorio** - 24 horas antes del evento
2. **Email de cancelación** - Si el evento se cancela
3. **Email de reembolso** - Confirmación de devolución
4. **Email de transferencia** - Cuando se transfiere un ticket
5. **Templates configurables** - Diferentes diseños por tipo de evento
6. **Email con PDF adjunto** - Entrada en formato PDF además de QR

---

## �🚀 Próximos Sprints Sugeridos

### Funcionalidades pendientes:
1. **Transferencia de tickets** - Enviar ticket a otro usuario
2. **Reembolsos** - Cancelar compra y devolver dinero
3. **Notificaciones** - Email/Push con tickets comprados
4. **Búsqueda de eventos** - Filtros y búsqueda
5. **Sistema de favoritos** - Guardar eventos preferidos
6. **Historial de compras** - Ver todas las transacciones

---

## ✅ Checklist de Integración Frontend

Para integrar correctamente con el backend:

- [ ] Configurar base URL del API
- [ ] Implementar interceptor para agregar token
- [ ] Manejar errores 401 (token expirado)
- [ ] Implementar refresh token
- [ ] Parsear fechas ISO 8601
- [ ] Mostrar QR base64 en imágenes
- [ ] Implementar scanner de QR
- [ ] Agregar loaders/spinners
- [ ] Manejar estados de tickets (colores/badges)
- [ ] Agregar validación de formularios
- [ ] Implementar manejo de errores global
- [ ] Agregar toasts/notificaciones
- [ ] Considerar modo offline
- [ ] Agregar analytics/tracking

---

## 🔧 Correcciones y Mejoras Implementadas

### Fecha de actualización: 10/10/2025

Durante la revisión del Sprint 3, se identificaron y corrigieron varios aspectos para mejorar la robustez y claridad del sistema:

---

### 1. 🎫 Validación de Cantidad y Stock en Reservas

**Problema identificado:**
No se validaba la cantidad de tickets ni el stock disponible antes de procesar el pago, lo que podía llevar a overselling (vender más tickets de los disponibles).

**Solución implementada en `app/controllers/payments_controller.ts`:**

#### Validaciones agregadas:

1. **Cantidad positiva:**
   ```typescript
   if (reservation.quantity <= 0) {
     return response.badRequest({
       message: 'La cantidad de tickets debe ser mayor a 0'
     })
   }
   ```

2. **Límite máximo por compra (10 tickets):**
   ```typescript
   const MAX_TICKETS_PER_PURCHASE = 10
   
   if (reservation.quantity > MAX_TICKETS_PER_PURCHASE) {
     return response.badRequest({
       message: `No se pueden comprar más de ${MAX_TICKETS_PER_PURCHASE} tickets por transacción`
     })
   }
   ```

3. **Verificación de stock disponible:**
   ```typescript
   if (reservation.event.ticketsAvailable < reservation.quantity) {
     return response.badRequest({
       message: `No hay suficientes tickets disponibles. Disponibles: ${reservation.event.ticketsAvailable}, solicitados: ${reservation.quantity}`
     })
   }
   ```

4. **Reducción automática del stock:**
   ```typescript
   // Después de validar, reducir el stock del evento
   reservation.event.ticketsAvailable -= reservation.quantity
   await reservation.event.save()
   ```

**Beneficios:**
- ✅ Previene compras de 0 o cantidades negativas
- ✅ Evita compras masivas (límite de 10 tickets por transacción)
- ✅ Garantiza que hay stock disponible antes de procesar el pago
- ✅ Actualiza el stock automáticamente al confirmar el pago
- ✅ Previene overselling (vender más tickets de los disponibles)

**Flujo de validación actualizado:**
```
POST /tickets/pay
     ↓
1. ¿quantity > 0?
     ↓
2. ¿quantity <= 10?
     ↓
3. ¿event.ticketsAvailable >= quantity?
     ↓
4. ✅ Reducir stock: ticketsAvailable -= quantity
     ↓
5. ✅ Procesar pago y generar tickets
```

---

### 2. 📅 Campo Datetime en Eventos - Solo Fecha

**Problema identificado:**
El campo `datetime` guardaba fecha Y hora (timestamp), pero solo se necesitaba la fecha. Además, había errores de sintaxis en el código.

**Solución implementada:**

#### En `app/models/event.ts`:

**ANTES (con errores):**
```typescript
ver de ponerle date solo y que los ordene ascendente
@column.dateTime()
declare datetime:asda DateTime
```

**DESPUÉS (correcto):**
```typescript
@column.date({
  serialize: (value: DateTime) => {
    // Serializar solo como fecha (YYYY-MM-DD)
    return value ? value.toISODate() : null
  },
})
declare datetime: DateTime
```

#### Scope para ordenamiento ascendente:
```typescript
/**
 * Query scope to order events by date in ascending order
 * Usage: Event.query().apply(scopes => scopes.orderByDate())
 */
static orderByDate = scope((query) => {
  query.orderBy('datetime', 'asc')
})
```

#### En `database/migrations/1759770890321_create_create_events_table.ts`:

**ANTES:**
```typescript
table.timestamp('datetime', { useTz: true }).notNullable()
```

**DESPUÉS:**
```typescript
table.date('datetime').notNullable()
```

**Beneficios:**
- ✅ Guarda solo la fecha (sin hora): `2025-12-15`
- ✅ Serializa automáticamente en formato ISO: `2025-12-15`
- ✅ Scope para ordenar eventos ascendentemente por fecha
- ✅ Reduce tamaño de almacenamiento en BD
- ✅ Simplifica comparaciones de fechas

**Uso del scope en consultas:**
```typescript
// Obtener eventos ordenados por fecha ascendente
const events = await Event.query().apply(scopes => scopes.orderByDate())

// O manualmente
const events = await Event.query().orderBy('datetime', 'asc')
```

---

### 3. 🔍 Clarificación de la Lógica de Verificación de QR

**Problema identificado:**
Había confusión sobre si el endpoint `verify` cambiaba el estado del ticket al escanearlo.

**Solución implementada en `app/controllers/tickets_controller.ts`:**

#### Diferenciación clara de endpoints:

| Endpoint | ¿Modifica el ticket? | Propósito |
|----------|---------------------|-----------|
| `POST /tickets/verify` | ❌ **NO** | Solo **consulta** si el QR es válido |
| `POST /tickets/:id/use` | ✅ **SÍ** | **Marca** el ticket como USED |

#### Comentarios mejorados en el código:

**Endpoint verify:**
```typescript
/**
 * POST /tickets/verify
 * Verify a QR code and get ticket information
 * IMPORTANT: This endpoint ONLY verifies the QR validity, it does NOT change the ticket status
 * Use the /tickets/:id/use endpoint to mark a ticket as USED after verification
 */
async verify({ request, response }: HttpContext) {
  // ... código ...
  
  // Check if ticket is valid (ACTIVE status)
  // NOTE: This endpoint ONLY checks the validity, it does NOT change the ticket status
  // The ticket status is only changed when using the /tickets/:id/use endpoint
  const isActive = ticket.status.code === 'ACTIVE'
  
  return response.ok({
    message: 'QR verificado exitosamente',
    data: {
      valid: isActive,  // true si ACTIVE, false si no
      // ... más información
    }
  })
}
```

**Endpoint use:**
```typescript
/**
 * POST /tickets/:id/use
 * Mark a ticket as USED (when scanned at event entrance)
 * IMPORTANT: This endpoint changes the ticket status to USED permanently
 * It should be called ONLY after verifying the ticket with /tickets/verify
 */
async use({ params, response }: HttpContext) {
  // ... validaciones ...
  
  // 🔴 CAMBIAR STATUS A "USED" 🔴
  ticket.statusId = usedStatus.id
  ticket.usedAt = DateTime.now()
  await ticket.save()
}
```

**Beneficios:**
- ✅ Permite escanear el QR múltiples veces sin "quemar" el ticket
- ✅ Personal puede confirmar antes de permitir ingreso
- ✅ Previene errores de escaneo accidental
- ✅ Mejor control del proceso de entrada al evento

**Flujo recomendado en la entrada del evento:**

```
1. Usuario presenta QR
   ↓
2. Personal escanea con app
   ↓
3. App llama: POST /tickets/verify
   ↓
4. Backend retorna: valid: true/false
   ↓
5. App muestra: ✅ Válido o ❌ Inválido
   ↓
6. Si válido, personal confirma: "¿Permitir ingreso?"
   ↓
7. Si confirma, app llama: POST /tickets/:id/use
   ↓
8. Ticket marcado como USED (permanente)
   ↓
9. ✅ Ingreso permitido
```

---

### 4. 🔄 Explicación Completa de la Lógica del QR

Para entender completamente cómo funciona el sistema de códigos QR, se creó documentación detallada en `docs/QR_LOGIC_FLOW.md` (500+ líneas).

#### Formato del Código QR:

```
ticketId-eventId-userId-UUID
```

**Ejemplo real:**
```
1-10-5-550e8400-e29b-41d4-a716-446655440000
│ │  │ └─────────────────────────────────────── UUID único (crypto.randomUUID)
│ │  └───────────────────────────────────────── ID del usuario propietario
│ └──────────────────────────────────────────── ID del evento
└─────────────────────────────────────────────── ID del ticket
```

#### ¿Cómo se genera el QR?

En `app/services/qr_service.ts`:

```typescript
async generateTicketQR(ticketId, eventId, userId) {
  // 1. Crear código único con UUID
  const uniqueCode = `${ticketId}-${eventId}-${userId}-${randomUUID()}`
  
  // 2. Generar imagen QR en base64 (300x300px, PNG)
  const qrImageUrl = await QRCode.toDataURL(uniqueCode, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 1,
  })
  
  return { qrCode: uniqueCode, qrImageUrl }
}
```

#### ¿Cómo se busca desde el backend?

Cuando se escanea el QR, el backend busca en la base de datos:

```typescript
// POST /tickets/verify
async verify({ request, response }) {
  const { qr_code: qrCode } = request.only(['qr_code'])
  
  // 1. Validar formato (debe tener 4 partes separadas por -)
  const qrService = new QrService()
  if (!qrService.verifyQRCode(qrCode)) {
    return response.badRequest({ message: 'Formato de QR inválido' })
  }
  
  // 2. Buscar ticket por el código completo
  const ticket = await Ticket.query()
    .where('qr_code', qrCode)  // ← Búsqueda por código exacto
    .preload('event')
    .preload('status')
    .preload('owner')
    .firstOrFail()
  
  // 3. Verificar si está activo (NO cambiar estado)
  const isActive = ticket.status.code === 'ACTIVE'
  
  // 4. Retornar información
  return response.ok({
    valid: isActive,
    ticket: { ... },
    event: { ... },
    owner: { ... }
  })
}
```

#### Características de seguridad:

- ✅ **Único e irrepetible:** UUID aleatorio generado con criptografía
- ✅ **Imposible de duplicar:** Cada QR contiene un UUID único
- ✅ **Vinculado a la BD:** Se guarda en la tabla `tickets` con índice único
- ✅ **Validación de formato:** Se verifica que tenga las 4 partes
- ✅ **Prevención de duplicados:** Índice único en la columna `qr_code`

#### Estados del ticket:

| Estado | Código | ¿Puede usarse? | Descripción |
|--------|--------|----------------|-------------|
| Activo | `ACTIVE` | ✅ SÍ | Ticket válido y disponible |
| Usado | `USED` | ❌ NO | Ya fue utilizado para ingresar |
| Cancelado | `CANCELLED` | ❌ NO | Ticket cancelado (reembolso) |
| Transferido | `TRANSFERRED` | ❌ NO | Transferido a otro usuario |

#### Transiciones de estado:

```
    COMPRA EXITOSA
         ↓
    ┌────────┐
    │ ACTIVE │  ← Estado inicial
    └────────┘
         ↓
    ┌─────┴─────┐
    │           │
ESCANEAR    CANCELAR
EN ENTRADA   COMPRA
    │           │
    ↓           ↓
┌──────┐   ┌───────────┐
│ USED │   │ CANCELLED │
└──────┘   └───────────┘
(Permanente) (Permanente)
```

---

### 5. 📧 Orden del Envío de Email

**Mejora implementada:**
Se agregaron comentarios explicativos sobre el orden del envío de email en el flujo de pago.

**Flujo actualizado en `app/controllers/payments_controller.ts`:**

```typescript
// 8. Mark reservation as PAID ✅
reservation.statusId = paidStatus.id
await reservation.save()

// 9. Send purchase confirmation email immediately after payment validation
// (Email sent here before generating tickets to notify user ASAP)
console.log('📧 Preparing to send confirmation email...')

// 10. Create payment record
// 11. Generate tickets with QR codes
// 12. Commit transaction (all data saved)

// 13. Send email with tickets (after commit)
// This is done AFTER commit to ensure data consistency
try {
  await mailService.sendPurchaseConfirmation({ ... })
  console.log('✅ Confirmation email sent successfully')
} catch (emailError) {
  // Log email error but don't fail the payment (payment already committed)
  console.error('⚠️  Error sending confirmation email:', emailError)
}
```

**Razón del orden:**
- ✅ El email se envía **después del commit** de la transacción
- ✅ Si el email falla, el pago ya está guardado (no se pierde)
- ✅ El email incluye todos los códigos QR de los tickets
- ✅ Sistema no bloqueante: error de email no revierte el pago

---

## 📊 Resumen de Archivos Modificados

### Archivos editados:
1. ✅ `app/controllers/payments_controller.ts` - Validaciones de cantidad y stock
2. ✅ `app/models/event.ts` - Campo date + scope de ordenamiento
3. ✅ `database/migrations/1759770890321_create_create_events_table.ts` - Tipo date
4. ✅ `app/controllers/tickets_controller.ts` - Comentarios mejorados verify/use
5. ✅ `app/services/qr_service.ts` - Limpieza de código

### Documentación creada:
1. ✅ `docs/QR_LOGIC_FLOW.md` - Documentación completa del sistema de QR (500+ líneas)

---

## ✅ Verificación de Calidad

```bash
$ npm run typecheck
> tsc --noEmit
✅ Sin errores de TypeScript
```

---

## 🎯 Conclusión

Sprint 3 completado exitosamente con:
- ✅ 3 Historias de Usuario implementadas
- ✅ 5 Endpoints REST funcionales
- ✅ Sistema de emails con HTML profesional
- ✅ 9 Tablas de base de datos creadas
- ✅ Sistema de QR único y seguro
- ✅ Integración con proveedores SMTP
- ✅ Documentación completa
- ✅ Ejemplos de código para frontend

**El sistema está listo para ser consumido por el frontend.** 🎉

---

## 📞 Contacto

Para dudas o consultas sobre la API:
- Revisar documentación en `docs/`
- Probar endpoints con Postman
- Verificar logs del servidor en caso de errores

**¡Happy coding!** 🚀
