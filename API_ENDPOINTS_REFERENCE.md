# 📚 API Endpoints - Referencia Completa para Frontend

**Proyecto:** API-Entradas  
**Versión:** 1.0  
**Última actualización:** 10/10/2025  
**Base URL:** `http://localhost:3333` (desarrollo)

---

## 📋 Índice

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Eventos](#eventos)
4. [Reservas](#reservas)
5. [Pagos y Tickets](#pagos-y-tickets)
6. [Verificación de QR](#verificación-de-qr)
7. [Códigos de Estado HTTP](#códigos-de-estado-http)
8. [Formatos de Datos](#formatos-de-datos)

---

## 🔐 Autenticación

Todos los endpoints (excepto login y registro) requieren autenticación mediante Bearer Token.

```http
Authorization: Bearer {tu_token_aquí}
```

### Obtener Token

**Endpoint:** `/usuarios/login`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `UsersController.login`  
**Requiere autenticación:** ❌ NO

**Request:**

```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

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

**Uso en el frontend:**

```javascript
// Guardar el token al hacer login
const response = await fetch('http://localhost:3333/usuarios/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const data = await response.json()
localStorage.setItem('token', data.token)

// Usar el token en todas las peticiones
const token = localStorage.getItem('token')
fetch('http://localhost:3333/tickets', {
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## 👤 Usuarios

### 1. Registrar Usuario

**Endpoint:** `/usuarios/register`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `UsersController.register`  
**Requiere autenticación:** ❌ NO

**Request:**

```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (201 Created):**

```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 5,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com"
  }
}
```

---

### 2. Obtener Perfil del Usuario Autenticado

**Endpoint:** `/usuarios/me`  
**Método:** `GET`  
**Ubicación:** `start/routes.ts` → `UsersController.me`  
**Requiere autenticación:** ✅ SÍ

**Request:**

```http
GET /usuarios/me
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "id": 5,
  "email": "juan@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "createdAt": "2025-10-01T10:00:00.000-03:00"
}
```

---

### 3. Cerrar Sesión

**Endpoint:** `/usuarios/logout`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `UsersController.logout`  
**Requiere autenticación:** ✅ SÍ

**Request:**

```http
POST /usuarios/logout
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

## 🎉 Eventos

### 1. Listar Todos los Eventos

**Endpoint:** `/eventos`  
**Método:** `GET`  
**Ubicación:** TBD (por implementar)  
**Requiere autenticación:** ❌ NO (público)

**Query params opcionales:**

- `?fecha=2025-12-15` - Filtrar por fecha
- `?search=Rock` - Buscar por título
- `?limit=10&page=1` - Paginación

**Response esperado:**

```json
{
  "data": [
    {
      "id": 10,
      "title": "Concierto Rock 2025",
      "description": "El mejor concierto del año",
      "datetime": "2025-12-15",
      "price": 2500,
      "ticketsTotal": 1000,
      "ticketsAvailable": 750,
      "venue": {
        "id": 5,
        "name": "Estadio Luna Park",
        "address": "Av. Corrientes 1234, CABA"
      }
    }
  ],
  "meta": {
    "total": 50,
    "perPage": 10,
    "currentPage": 1
  }
}
```

---

### 2. Obtener Detalle de un Evento

**Endpoint:** `/eventos/:id`  
**Método:** `GET`  
**Ubicación:** TBD (por implementar)  
**Requiere autenticación:** ❌ NO (público)

**Request:**

```http
GET /eventos/10
```

**Response esperado:**

```json
{
  "id": 10,
  "title": "Concierto Rock 2025",
  "description": "El mejor concierto del año",
  "datetime": "2025-12-15",
  "price": 2500,
  "ticketsTotal": 1000,
  "ticketsAvailable": 750,
  "venue": {
    "id": 5,
    "name": "Estadio Luna Park",
    "address": "Av. Corrientes 1234, CABA",
    "capacity": 5000
  },
  "company": {
    "id": 1,
    "name": "Productora de Eventos SA"
  },
  "status": "ACTIVE"
}
```

---

## 📝 Reservas

### 1. Crear Reserva

**Endpoint:** `/reservas`  
**Método:** `POST`  
**Ubicación:** TBD (por implementar)  
**Requiere autenticación:** ✅ SÍ

**Request:**

```json
{
  "eventId": 10,
  "quantity": 2
}
```

**Response esperado (201 Created):**

```json
{
  "message": "Reserva creada exitosamente",
  "data": {
    "id": 123,
    "userId": 5,
    "eventId": 10,
    "quantity": 2,
    "totalAmount": 5000,
    "status": "PENDING",
    "token": "RES-1728567890123",
    "expiresAt": "2025-10-10T15:30:00.000-03:00"
  }
}
```

**Notas:**

- La reserva expira en 15-30 minutos (configurable)
- Debe completarse el pago antes de que expire
- El stock se reserva temporalmente

---

### 2. Obtener Mis Reservas

**Endpoint:** `/reservas`  
**Método:** `GET`  
**Ubicación:** TBD (por implementar)  
**Requiere autenticación:** ✅ SÍ

**Response esperado:**

```json
{
  "data": [
    {
      "id": 123,
      "quantity": 2,
      "totalAmount": 5000,
      "status": "PENDING",
      "expiresAt": "2025-10-10T15:30:00.000-03:00",
      "event": {
        "id": 10,
        "title": "Concierto Rock 2025",
        "datetime": "2025-12-15"
      }
    }
  ]
}
```

---

## 💳 Pagos y Tickets

### 1. Procesar Pago y Generar Tickets

**Endpoint:** `/tickets/pay`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `PaymentsController.pay`  
**Requiere autenticación:** ✅ SÍ

**Propósito:** Procesar el pago de una reserva y generar los tickets con códigos QR únicos.

**Request:**

```json
{
  "reservation_id": 123
}
```

**Response (200 OK):**

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
      "externalRef": "PAY-1728567890-123"
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

**Validaciones:**

- ✅ La reserva debe existir
- ✅ La reserva debe estar en estado `PENDING`
- ✅ La reserva no debe estar expirada
- ✅ La cantidad debe ser > 0
- ✅ La cantidad debe ser <= 10 (límite por transacción)
- ✅ Debe haber stock disponible (`event.ticketsAvailable >= quantity`)

**Errores posibles:**

```json
// 400 - Reserva no está en estado PENDING
{
  "error": "Invalid reservation status",
  "message": "La reserva no está en estado pendiente"
}

// 400 - Reserva expirada
{
  "error": "Reservation expired",
  "message": "La reserva ha expirado"
}

// 400 - Cantidad inválida
{
  "error": "Quantity exceeded",
  "message": "No se pueden comprar más de 10 tickets por transacción"
}

// 400 - Stock insuficiente
{
  "error": "Insufficient stock",
  "message": "No hay suficientes tickets disponibles. Disponibles: 5, solicitados: 10"
}

// 404 - Reserva no encontrada
{
  "error": "Not found",
  "message": "Reserva no encontrada"
}
```

**Notas importantes:**

- Los tickets se generan automáticamente según la cantidad de la reserva
- Cada ticket tiene un código QR único e irrepetible
- El `qrImageUrl` es una imagen en base64 (data URL) lista para usar en `<img src="...">`
- El stock del evento se reduce automáticamente
- Se envía un email de confirmación automáticamente

---

### 2. Listar Mis Tickets

**Endpoint:** `/tickets`  
**Método:** `GET`  
**Ubicación:** `start/routes.ts` → `TicketsController.index`  
**Requiere autenticación:** ✅ SÍ

**Propósito:** Obtener todos los tickets del usuario autenticado.

**Request:**

```http
GET /tickets
Authorization: Bearer {token}
```

**Response (200 OK):**

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
        "datetime": "2025-12-15"
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

**Notas:**

- Los tickets están ordenados por fecha de creación (más reciente primero)
- El campo `status` puede ser: `ACTIVE`, `USED`, `CANCELLED`, `TRANSFERRED`
- `usedAt` es `null` si el ticket no ha sido usado

---

### 3. Obtener Detalle de un Ticket

**Endpoint:** `/tickets/:id`  
**Método:** `GET`  
**Ubicación:** `start/routes.ts` → `TicketsController.show`  
**Requiere autenticación:** ✅ SÍ

**Propósito:** Obtener información completa de un ticket específico.

**Request:**

```http
GET /tickets/1
Authorization: Bearer {token}
```

**Response (200 OK):**

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
      "datetime": "2025-12-15",
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

**Errores:**

```json
// 404 - Ticket no encontrado o no pertenece al usuario
{
  "error": "Not found",
  "message": "Ticket no encontrado"
}
```

**Notas:**

- Solo se pueden ver tickets propios (del usuario autenticado)
- Incluye información completa del evento y venue

---

## 🔍 Verificación de QR

### 1. Verificar Código QR

**Endpoint:** `/tickets/verify`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `TicketsController.verify`  
**Requiere autenticación:** ✅ SÍ

**Propósito:** Verificar si un código QR es válido **SIN cambiar el estado del ticket**. Usar en apps de escaneo para verificar antes de permitir el ingreso.

**Request:**

```json
{
  "qr_code": "1-10-5-550e8400-e29b-41d4-a716-446655440000"
}
```

**Response - Ticket válido (200 OK):**

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
      "datetime": "2025-12-15",
      "venue": {
        "name": "Estadio Luna Park",
        "address": "Av. Corrientes 1234, CABA"
      }
    },
    "owner": {
      "id": 5,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@example.com"
    }
  }
}
```

**Response - Ticket ya usado (200 OK):**

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

**Errores:**

```json
// 400 - Formato de QR inválido
{
  "error": "Invalid QR code",
  "message": "El código QR no tiene un formato válido"
}

// 404 - QR no encontrado
{
  "error": "Not found",
  "message": "Ticket no encontrado o código QR inválido"
}
```

**⚠️ IMPORTANTE:**

- Este endpoint **NO cambia el estado del ticket**
- Puede llamarse múltiples veces sin problemas
- El campo `valid` es `true` solo si `status === 'ACTIVE'`
- Usar este endpoint para verificar ANTES de marcar como usado

**Flujo recomendado:**

1. Escanear QR con la cámara
2. Llamar a `POST /tickets/verify`
3. Mostrar resultado: ✅ Válido o ❌ Inválido
4. Si válido, preguntar: "¿Permitir ingreso?"
5. Si confirma, llamar a `POST /tickets/:id/use`

---

### 2. Marcar Ticket como Usado

**Endpoint:** `/tickets/:id/use`  
**Método:** `POST`  
**Ubicación:** `start/routes.ts` → `TicketsController.use`  
**Requiere autenticación:** ✅ SÍ

**Propósito:** Marcar un ticket como usado **permanentemente**. Usar SOLO después de verificar el QR y confirmar el ingreso.

**Request:**

```http
POST /tickets/1/use
Authorization: Bearer {token}
```

**Response (200 OK):**

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

**Errores:**

```json
// 400 - Ticket ya fue usado
{
  "error": "Ticket already used",
  "message": "Este ticket ya fue utilizado",
  "usedAt": "2025-12-15T20:15:00.000-03:00"
}

// 400 - Ticket no está ACTIVE
{
  "error": "Invalid ticket status",
  "message": "El ticket no puede ser usado. Estado actual: Cancelado"
}

// 404 - Ticket no encontrado
{
  "error": "Not found",
  "message": "Ticket no encontrado"
}
```

**⚠️ IMPORTANTE:**

- Este endpoint **SÍ cambia el estado del ticket a USED**
- El cambio es **permanente** (no se puede revertir)
- Una vez usado, el ticket no puede volver a usarse
- Solo llamar después de verificar con `/tickets/verify`

---

## 📊 Códigos de Estado HTTP

| Código | Significado           | Cuándo ocurre                        |
| ------ | --------------------- | ------------------------------------ |
| `200`  | OK                    | Operación exitosa                    |
| `201`  | Created               | Recurso creado exitosamente          |
| `400`  | Bad Request           | Validación fallida, datos inválidos  |
| `401`  | Unauthorized          | Token inválido, ausente o expirado   |
| `403`  | Forbidden             | Sin permisos para realizar la acción |
| `404`  | Not Found             | Recurso no encontrado                |
| `422`  | Unprocessable Entity  | Error de validación de datos         |
| `500`  | Internal Server Error | Error del servidor                   |

---

## 📅 Formatos de Datos

### Fechas

**Tipo:** ISO 8601 con timezone

**Formato:** `YYYY-MM-DD` (solo fecha) para eventos

**Ejemplo:** `2025-12-15`

**Parsing en JavaScript:**

```javascript
const eventDate = new Date('2025-12-15')
console.log(eventDate.toLocaleDateString('es-AR'))
// Output: "15/12/2025"
```

### Fechas y Horas

**Formato:** `YYYY-MM-DDTHH:mm:ss.sss±HH:mm`

**Ejemplo:** `2025-10-10T15:30:00.000-03:00`

**Parsing en JavaScript:**

```javascript
const datetime = new Date('2025-10-10T15:30:00.000-03:00')
console.log(datetime.toLocaleString('es-AR'))
// Output: "10/10/2025, 15:30:00"
```

### Imágenes QR

**Tipo:** Data URL (Base64)

**Formato:** `data:image/png;base64,{base64_data}`

**Ejemplo:**

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

### Formato del Código QR (String)

**Formato:** `{ticketId}-{eventId}-{userId}-{UUID}`

**Ejemplo:** `1-10-5-550e8400-e29b-41d4-a716-446655440000`

**Componentes:**

- `1` = ID del ticket
- `10` = ID del evento
- `5` = ID del usuario propietario
- `550e8400-e29b-41d4-a716-446655440000` = UUID único

---

## 🔄 Flujo Completo de Compra

```
1. Usuario navega por eventos
   GET /eventos

2. Usuario selecciona un evento
   GET /eventos/10

3. Usuario crea una reserva
   POST /reservas { eventId: 10, quantity: 2 }

4. Usuario procesa el pago
   POST /tickets/pay { reservation_id: 123 }

5. Backend genera tickets con QR
   ✅ Tickets creados
   📧 Email enviado con QR codes

6. Usuario ve sus tickets
   GET /tickets

7. Usuario ve detalle de un ticket
   GET /tickets/1
```

---

## 🎫 Flujo de Escaneo en el Evento

```
1. Personal abre app de escaneo
   [Autenticado con Bearer Token]

2. Usuario presenta su QR
   [QR visible en pantalla o impreso]

3. Personal escanea el QR
   [Cámara lee el código]

4. App verifica el QR
   POST /tickets/verify { qr_code: "1-10-5-uuid..." }

5. Backend responde:
   { valid: true/false, ticket: {...}, event: {...}, owner: {...} }

6. App muestra resultado:
   ✅ VÁLIDO:
      - Nombre: Juan Pérez
      - Evento: Concierto Rock 2025
      - Fecha: 15/12/2025
      - [Botón: Permitir Ingreso]

   ❌ INVÁLIDO:
      - Estado: USED
      - Usado el: 15/12/2025 20:15
      - [Botón: Denegar Ingreso]

7. Si válido, personal confirma ingreso
   [Click en "Permitir Ingreso"]

8. App marca ticket como usado
   POST /tickets/1/use

9. Backend cambia estado a USED
   ✅ Ticket "quemado" (no se puede volver a usar)

10. App confirma:
    ✅ Ingreso permitido
```

---

## 🛠️ Herramientas de Testing

### Postman/Thunder Client

Colección de ejemplo:

```json
{
  "name": "API Entradas",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "{{baseUrl}}/usuarios/login",
      "body": {
        "email": "usuario@example.com",
        "password": "password123"
      }
    },
    {
      "name": "Mis Tickets",
      "method": "GET",
      "url": "{{baseUrl}}/tickets",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    },
    {
      "name": "Procesar Pago",
      "method": "POST",
      "url": "{{baseUrl}}/tickets/pay",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "reservation_id": 123
      }
    },
    {
      "name": "Verificar QR",
      "method": "POST",
      "url": "{{baseUrl}}/tickets/verify",
      "headers": {
        "Authorization": "Bearer {{token}}"
      },
      "body": {
        "qr_code": "1-10-5-550e8400-e29b-41d4-a716-446655440000"
      }
    },
    {
      "name": "Marcar como Usado",
      "method": "POST",
      "url": "{{baseUrl}}/tickets/1/use",
      "headers": {
        "Authorization": "Bearer {{token}}"
      }
    }
  ]
}
```

### Variables de entorno:

```
baseUrl=http://localhost:3333
token={obtenido del login}
```

---

## 💡 Ejemplos de Código Frontend

### React - Componente de Login

```jsx
import { useState } from 'react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:3333/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login fallido')
      }

      const data = await response.json()

      // Guardar token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirigir al dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Iniciar Sesión</button>
    </form>
  )
}
```

### React - Listar Mis Tickets

```jsx
import { useEffect, useState } from 'react'

function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3333/tickets', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Error al obtener tickets')
        }

        const data = await response.json()
        setTickets(data.data)
      } catch (error) {
        console.error(error)
        alert('Error al cargar tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div className="tickets-grid">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="ticket-card">
          <h3>{ticket.event.title}</h3>
          <p>{new Date(ticket.event.datetime).toLocaleDateString('es-AR')}</p>

          <img src={ticket.qrImageUrl} alt="QR Code" style={{ width: 200, height: 200 }} />

          <span className={`badge ${ticket.status.toLowerCase()}`}>
            {ticket.status === 'ACTIVE' ? '✅ Válido' : '❌ Usado'}
          </span>

          {ticket.usedAt && <p>Usado el: {new Date(ticket.usedAt).toLocaleString('es-AR')}</p>}
        </div>
      ))}
    </div>
  )
}
```

### React - Procesar Pago

```jsx
async function processPayment(reservationId) {
  try {
    const token = localStorage.getItem('token')

    const response = await fetch('http://localhost:3333/tickets/pay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reservation_id: reservationId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al procesar el pago')
    }

    const data = await response.json()

    console.log('Pago exitoso:', data)
    console.log('Tickets generados:', data.data.tickets.length)

    // Mostrar mensaje de éxito
    alert(`¡Compra exitosa! Se generaron ${data.data.tickets.length} tickets`)

    // Redirigir a mis tickets
    window.location.href = '/mis-tickets'
  } catch (error) {
    alert('Error al procesar el pago: ' + error.message)
  }
}
```

### React - Scanner de QR

```jsx
import QrScanner from 'qr-scanner' // librería de ejemplo

function QRVerifier() {
  const [scanResult, setScanResult] = useState(null)
  const [ticket, setTicket] = useState(null)

  const handleScan = async (qrCode) => {
    try {
      const token = localStorage.getItem('token')

      // 1. Verificar el QR
      const response = await fetch('http://localhost:3333/tickets/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: qrCode }),
      })

      const data = await response.json()
      setTicket(data.data)

      if (data.data.valid) {
        setScanResult('valid')
      } else {
        setScanResult('invalid')
      }
    } catch (error) {
      setScanResult('error')
      console.error('Error:', error)
    }
  }

  const allowEntry = async () => {
    if (!ticket || !ticket.valid) return

    try {
      const token = localStorage.getItem('token')

      // 2. Marcar como usado
      await fetch(`http://localhost:3333/tickets/${ticket.ticket.id}/use`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      alert('✅ Ingreso permitido')
      setScanResult(null)
      setTicket(null)
    } catch (error) {
      alert('Error al marcar ticket: ' + error.message)
    }
  }

  return (
    <div>
      <QrScanner onScan={handleScan} />

      {ticket && (
        <div className={`result ${scanResult}`}>
          {scanResult === 'valid' ? (
            <div className="valid-ticket">
              <h2>✅ Ticket Válido</h2>
              <p>
                <strong>Propietario:</strong> {ticket.owner.firstName} {ticket.owner.lastName}
              </p>
              <p>
                <strong>Evento:</strong> {ticket.event.title}
              </p>
              <p>
                <strong>Fecha:</strong>{' '}
                {new Date(ticket.event.datetime).toLocaleDateString('es-AR')}
              </p>
              <button onClick={allowEntry}>Permitir Ingreso</button>
            </div>
          ) : (
            <div className="invalid-ticket">
              <h2>❌ Ticket Inválido</h2>
              <p>
                <strong>Estado:</strong> {ticket.ticket.statusName}
              </p>
              {ticket.ticket.usedAt && (
                <p>
                  <strong>Usado el:</strong>{' '}
                  {new Date(ticket.ticket.usedAt).toLocaleString('es-AR')}
                </p>
              )}
              <button>Denegar Ingreso</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 🔐 Seguridad

### Headers Obligatorios

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

### Manejo de Token Expirado

```javascript
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token')

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    // Token expirado
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }

  return response
}
```

### Interceptor con Axios

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3333',
})

// Request interceptor - agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 📞 Soporte

Para dudas o problemas con la API:

1. Revisar esta documentación
2. Consultar `docs/QR_LOGIC_FLOW.md` para entender el flujo de QR
3. Revisar `SPRINT_3_REPORTE_FINAL.md` para ejemplos detallados
4. Verificar logs del servidor en caso de errores 500
5. Usar Postman para probar endpoints individualmente

---

## 📝 Notas Finales

### URLs en Producción

Reemplazar `http://localhost:3333` con la URL de producción:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333'
```

### CORS

El backend ya tiene CORS configurado para permitir peticiones del frontend.

### Rate Limiting

Hay límite de peticiones por minuto (configurado en el backend). Si recibes error 429, espera unos segundos.

---

**Documentación generada:** 10/10/2025  
**Versión:** 1.0  
**Mantenida por:** Backend Team
