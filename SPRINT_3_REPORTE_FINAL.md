# 📊 Sprint 3 - Reporte Final

**Proyecto:** API-Entradas  
**Sprint:** 3  
**Fecha:** Octubre 2025  
**Estado:** ✅ COMPLETADO

---

## 📋 Resumen Ejecutivo

En este sprint se implementaron 2 Historias de Usuario completas relacionadas con el sistema de pagos y generación de tickets con códigos QR:

1. **HU: Completar pago** - Sistema de procesamiento de pagos simulado
2. **HU: Generar código QR único** - Generación automática de tickets con QR

**Resultado:** 5 endpoints REST completamente funcionales + documentación completa

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

---

## 🚀 Próximos Sprints Sugeridos

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

## 🎯 Conclusión

Sprint 3 completado exitosamente con:
- ✅ 2 Historias de Usuario implementadas
- ✅ 5 Endpoints REST funcionales
- ✅ 9 Tablas de base de datos creadas
- ✅ Sistema de QR único y seguro
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
