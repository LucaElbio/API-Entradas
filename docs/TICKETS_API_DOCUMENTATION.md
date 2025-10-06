# API de Tickets - Documentación Completa

## 📋 Índice
1. [Listar tickets del usuario](#1-get-tickets)
2. [Obtener ticket específico](#2-get-ticketsid)
3. [Verificar código QR](#3-post-ticketsverify)
4. [Marcar ticket como usado](#4-post-ticketsiduse)

---

## 1. GET /tickets
Obtiene todos los tickets del usuario autenticado.

### Autenticación
✅ Requerida

### Request
```http
GET /tickets
Authorization: Bearer {token}
```

### Response (200 OK)
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
    },
    {
      "id": 2,
      "qrCode": "2-10-5-771f9511-f3ac-52e5-b827-557766551111",
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

### Estados posibles del ticket
- `ACTIVE` - Ticket activo, listo para usar
- `USED` - Ticket ya utilizado
- `CANCELLED` - Ticket cancelado
- `TRANSFERRED` - Ticket transferido a otro usuario

---

## 2. GET /tickets/:id
Obtiene los detalles completos de un ticket específico del usuario autenticado.

### Autenticación
✅ Requerida

### Parámetros
- `id` (path) - ID del ticket

### Request
```http
GET /tickets/1
Authorization: Bearer {token}
```

### Response (200 OK)
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

### Response (404 Not Found)
```json
{
  "error": "Not found",
  "message": "Ticket no encontrado"
}
```

**Nota:** Solo se pueden obtener tickets del usuario autenticado. Si el ticket no pertenece al usuario, se retorna 404.

---

## 3. POST /tickets/verify
Verifica la validez de un código QR y obtiene información del ticket asociado.

### Autenticación
✅ Requerida

### Request Body
```json
{
  "qr_code": "1-10-5-550e8400-e29b-41d4-a716-446655440000"
}
```

### Request
```http
POST /tickets/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "qr_code": "1-10-5-550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (200 OK) - Ticket válido
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

### Response (200 OK) - Ticket inválido (ya usado)
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

### Response (400 Bad Request) - Formato inválido
```json
{
  "error": "Invalid QR code",
  "message": "El código QR no tiene un formato válido"
}
```

### Response (404 Not Found) - QR no encontrado
```json
{
  "error": "Not found",
  "message": "Ticket no encontrado o código QR inválido"
}
```

### Lógica de Validación
1. **Formato:** Verifica que el QR tenga el formato correcto (4 partes separadas por guiones)
2. **Existencia:** Busca el ticket en la base de datos
3. **Estado:** El campo `valid` es `true` solo si el estado es `ACTIVE`
4. **Información:** Retorna datos completos del ticket, evento y propietario

**Casos de uso:**
- ✅ Verificar ticket antes de usarlo
- ✅ App de escaneo en la entrada del evento
- ✅ Validación de autenticidad del ticket

---

## 4. POST /tickets/:id/use
Marca un ticket como usado. Se utiliza al escanear el ticket en la entrada del evento.

### Autenticación
✅ Requerida

### Parámetros
- `id` (path) - ID del ticket

### Request
```http
POST /tickets/1/use
Authorization: Bearer {token}
```

### Response (200 OK)
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

### Response (400 Bad Request) - Ticket ya usado
```json
{
  "error": "Ticket already used",
  "message": "Este ticket ya fue utilizado",
  "usedAt": "2025-12-15T20:15:00.000-03:00"
}
```

### Response (400 Bad Request) - Estado inválido
```json
{
  "error": "Invalid ticket status",
  "message": "El ticket no puede ser usado. Estado actual: Cancelado"
}
```

### Response (404 Not Found)
```json
{
  "error": "Not found",
  "message": "Ticket no encontrado"
}
```

### Validaciones
1. ✅ El ticket existe
2. ✅ El estado es `ACTIVE`
3. ✅ No ha sido usado previamente (`usedAt` es null)

### Cambios realizados
- Estado del ticket: `ACTIVE` → `USED`
- Campo `used_at`: null → fecha y hora actual
- Campo `status_id`: actualizado al ID del estado `USED`

**Casos de uso:**
- ✅ Escaneo en la entrada del evento
- ✅ Control de acceso
- ✅ Prevención de uso múltiple del mismo ticket

---

## 🔐 Seguridad

### Autenticación
Todos los endpoints requieren autenticación mediante Bearer Token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Autorización
- Los endpoints GET `/tickets` y GET `/tickets/:id` solo retornan tickets del usuario autenticado
- No es posible ver tickets de otros usuarios sin autorización
- El endpoint POST `/tickets/:id/use` puede ser usado por cualquier usuario autenticado con el token (útil para personal del evento)

---

## 🔄 Flujo de Uso Completo

### 1. Usuario compra tickets
```http
POST /tickets/pay
{
  "reservation_id": 123
}
```
↓ Genera tickets con QR codes

### 2. Usuario consulta sus tickets
```http
GET /tickets
```
↓ Recibe lista de tickets con QR

### 3. Usuario ve detalle de un ticket
```http
GET /tickets/1
```
↓ Obtiene toda la información incluyendo evento y lugar

### 4. Personal verifica ticket en el evento
```http
POST /tickets/verify
{
  "qr_code": "1-10-5-uuid..."
}
```
↓ Valida si el ticket es genuino y está activo

### 5. Personal permite el ingreso
```http
POST /tickets/1/use
```
↓ Marca el ticket como usado

### 6. Usuario intenta ingresar nuevamente
```http
POST /tickets/verify
{
  "qr_code": "1-10-5-uuid..."
}
```
↓ Sistema retorna `valid: false` porque ya fue usado

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa |
| 400 | Bad Request | Validación fallida, ticket ya usado, etc. |
| 401 | Unauthorized | Token inválido o ausente |
| 404 | Not Found | Ticket no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## 💡 Ejemplos de Integración

### Frontend - Mostrar QR del ticket
```javascript
// React/Vue/Angular
<img 
  src={ticket.qrImageUrl} 
  alt="QR Code" 
  style={{ width: 300, height: 300 }}
/>
```

### Mobile App - Escanear QR
```javascript
// Pseudo-código
async function scanAndVerify(qrCode) {
  const response = await fetch('/tickets/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ qr_code: qrCode })
  })
  
  const data = await response.json()
  
  if (data.data.valid) {
    // Permitir ingreso
    await markAsUsed(data.data.ticket.id)
  } else {
    // Denegar ingreso
    alert('Ticket inválido o ya usado')
  }
}
```

---

## 🧪 Testing

### Test con cURL

#### Listar tickets
```bash
curl -X GET http://localhost:3333/tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Ver ticket específico
```bash
curl -X GET http://localhost:3333/tickets/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Verificar QR
```bash
curl -X POST http://localhost:3333/tickets/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"1-10-5-550e8400-e29b-41d4-a716-446655440000"}'
```

#### Marcar como usado
```bash
curl -X POST http://localhost:3333/tickets/1/use \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Conclusión

La API de Tickets proporciona:

- ✅ **Consulta de tickets** - Usuarios pueden ver sus tickets
- ✅ **Detalles completos** - Toda la información necesaria para el evento
- ✅ **Verificación de QR** - Validación de autenticidad
- ✅ **Control de acceso** - Marcar tickets como usados
- ✅ **Prevención de fraudes** - No se puede usar un ticket dos veces
- ✅ **Trazabilidad** - Registro de cuándo se usó cada ticket

**Sistema completo y listo para producción!** 🎉
