# 📧 Guía de Integración - Sistema de Emails con QR

## Para el equipo de Frontend

Esta guía explica cómo funciona el sistema de emails automáticos y qué debe hacer el frontend para que los usuarios reciban sus entradas por correo.

---

## 🎯 Resumen Ejecutivo

**El backend YA envía emails automáticamente.** El frontend solo necesita:
1. Recolectar el email del usuario al registrarse
2. Procesar el pago llamando al endpoint correcto
3. Mostrar confirmación al usuario

**Eso es todo.** El email se envía automáticamente en segundo plano.

---

## 📋 Flujo Completo de Compra

### 1. **Registro de Usuario**
```javascript
POST /register
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "usuario@ejemplo.com",  // ← Este email recibirá las entradas
  "password": "Password123",
  "roleCode": "CUSTOMER"
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "usuario@ejemplo.com",
    "roleCode": "CUSTOMER"
  }
}
```

---

### 2. **Login**
```javascript
POST /login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "usuario@ejemplo.com"
    }
  }
}
```

**⚠️ Importante:** Guarda el `token` para las siguientes peticiones.

---

### 3. **Crear Reserva**
```javascript
POST /reservations
Content-Type: application/json
Authorization: Bearer {TOKEN_DEL_LOGIN}

{
  "eventId": 1,
  "quantity": 2
}
```

**Respuesta:**
```json
{
  "message": "Reserva creada exitosamente",
  "data": {
    "id": 1,
    "userId": 1,
    "eventId": 1,
    "quantity": 2,
    "totalAmount": 100.00,
    "statusCode": "PENDING",
    "expiresAt": "2025-11-17T23:55:00.000Z"
  }
}
```

**⚠️ Nota:** La reserva expira en 15 minutos. Muestra un timer al usuario.

---

### 4. **Procesar Pago** 🎯 (Aquí se envía el email)
```javascript
POST /tickets/pay
Authorization: Bearer {TOKEN_DEL_LOGIN}
```

**No necesita body.** El backend encuentra automáticamente la reserva pendiente del usuario.

**Respuesta exitosa:**
```json
{
  "message": "Pago procesado exitosamente",
  "data": {
    "reservation": {
      "id": 1,
      "status": "PAID",
      "quantity": 2,
      "totalAmount": 100.00
    },
    "payment": {
      "id": 1,
      "status": "APPROVED",
      "amount": 100.00,
      "provider": "SIMULATED_GATEWAY",
      "externalRef": "PAY-1731885600000-1"
    },
    "tickets": [
      {
        "id": 1,
        "qrCode": "1|1|f1db4d38-a6f7-45a1-9e81-648208fac22d",
        "qrImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
        "status": "ACTIVE"
      },
      {
        "id": 2,
        "qrCode": "1|1|24eb2ce5-d22f-4260-80d2-a13795af1918",
        "qrImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
        "status": "ACTIVE"
      }
    ]
  }
}
```

### ✅ **¡EMAIL ENVIADO AUTOMÁTICAMENTE!**

Cuando esta petición es exitosa, el backend **automáticamente**:
- ✅ Genera los tickets con códigos QR
- ✅ Envía un email al correo del usuario
- ✅ El email incluye todos los QR codes como imágenes adjuntas

---

## 🎨 Interfaz de Usuario Recomendada

### Después de procesar el pago, muestra:

```jsx
// Ejemplo en React
function PaymentSuccess({ tickets, userEmail }) {
  return (
    <div className="success-container">
      <h1>¡Compra Exitosa! 🎉</h1>
      
      <div className="email-notification">
        <p>
          📧 Hemos enviado tus entradas a: <strong>{userEmail}</strong>
        </p>
        <p className="hint">
          Revisa tu bandeja de entrada (y spam) para ver tus códigos QR
        </p>
      </div>

      <h2>Tus Entradas:</h2>
      {tickets.map((ticket) => (
        <div key={ticket.id} className="ticket-card">
          <h3>Entrada #{ticket.id}</h3>
          <img 
            src={ticket.qrImageUrl} 
            alt={`QR Ticket ${ticket.id}`}
            className="qr-code"
          />
          <p className="qr-text">{ticket.qrCode}</p>
          <button onClick={() => downloadQR(ticket)}>
            Descargar QR
          </button>
        </div>
      ))}

      <div className="instructions">
        <h3>⚠️ Instrucciones Importantes:</h3>
        <ul>
          <li>Guarda este correo o descarga los QR codes</li>
          <li>Presenta el QR en la entrada del evento</li>
          <li>Cada QR es de un solo uso</li>
          <li>También puedes mostrar el QR directamente desde tu email</li>
        </ul>
      </div>
    </div>
  );
}

// Función para descargar QR
function downloadQR(ticket) {
  const link = document.createElement('a');
  link.href = ticket.qrImageUrl;
  link.download = `ticket-${ticket.id}-qr.png`;
  link.click();
}
```

---

## 📧 Contenido del Email (Automático)

El usuario recibirá un email profesional con:

### Asunto:
```
✅ Confirmación de compra - {Nombre del Evento}
```

### Contenido:
- ✅ Saludo personalizado con nombre del usuario
- ✅ Detalles del evento (fecha, hora, lugar, dirección)
- ✅ Resumen de pago (cantidad, precio, total, referencia)
- ✅ **Códigos QR como imágenes adjuntas** (un QR por entrada)
- ✅ Código de verificación visible debajo de cada QR
- ✅ Instrucciones de uso
- ✅ Información de contacto

---

## 🔧 Manejo de Errores

### Error: No hay reserva pendiente
```json
{
  "error": "Not found",
  "message": "Reserva no encontrada"
}
```
**Acción:** Redirigir al usuario a crear una nueva reserva.

---

### Error: Reserva expirada
```json
{
  "error": "Reservation expired",
  "message": "La reserva ha expirado"
}
```
**Acción:** Mostrar mensaje y permitir crear nueva reserva.

---

### Error: Sin stock
```json
{
  "error": "Insufficient stock",
  "message": "No hay suficientes tickets disponibles..."
}
```
**Acción:** Mostrar mensaje y sugerir reducir cantidad.

---

## 🎯 Checklist de Integración

### Frontend debe:
- [ ] Recolectar email válido en el registro
- [ ] Validar formato de email (nombre@dominio.com)
- [ ] Guardar y enviar el token en todas las peticiones autenticadas
- [ ] Mostrar timer de 15 minutos en la reserva
- [ ] Llamar a `/tickets/pay` al confirmar pago
- [ ] Mostrar mensaje de "Email enviado a {email}"
- [ ] Permitir descargar los QR codes desde la pantalla de éxito
- [ ] Manejar errores de reserva expirada
- [ ] Manejar errores de stock insuficiente

### Backend hace automáticamente:
- [x] Validar stock disponible
- [x] Crear tickets con QR codes únicos
- [x] Generar imágenes QR en formato PNG
- [x] Enviar email con todas las entradas
- [x] Adjuntar QR codes al email
- [x] Registrar el pago
- [x] Actualizar estadísticas en tiempo real

---

## 🧪 Testing Frontend

### Prueba completa:
```javascript
// 1. Registrar usuario
const registerResponse = await fetch('/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'tu-email@gmail.com', // ← Usa tu email real para pruebas
    password: 'Test1234',
    roleCode: 'CUSTOMER'
  })
});

// 2. Login
const loginResponse = await fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'tu-email@gmail.com',
    password: 'Test1234'
  })
});
const { token } = await loginResponse.json().data;

// 3. Crear reserva
const reservationResponse = await fetch('/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    eventId: 1,
    quantity: 2
  })
});

// 4. Procesar pago (ENVÍA EMAIL AUTOMÁTICAMENTE)
const paymentResponse = await fetch('/tickets/pay', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await paymentResponse.json();
console.log('Tickets:', result.data.tickets);
console.log('📧 Email enviado a: tu-email@gmail.com');
```

**Resultado esperado:**
- ✅ Respuesta 200 OK
- ✅ Email recibido en la bandeja de entrada
- ✅ Email contiene 2 QR codes (uno por entrada)

---

## 🚀 Producción

### Variables de entorno (ya configuradas en backend):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nazzettagonzalo@gmail.com
SMTP_PASSWORD=svtrtrimxukwwlnf
MAIL_FROM_ADDRESS=noreply@api-entradas.com
MAIL_FROM_NAME=API Entradas
```

**⚠️ Importante para producción:**
- Considera usar un servicio profesional como SendGrid o AWS SES
- Configura dominio personalizado para emails (ej: @tu-empresa.com)
- Monitorea tasas de entrega de emails
- Implementa reintentos en caso de fallo

---

## 📞 Soporte

### Si el usuario no recibe el email:
1. **Verificar spam:** El email puede estar en la carpeta de spam/promociones
2. **Verificar email:** Confirmar que el email está escrito correctamente
3. **Ver logs del servidor:** El backend muestra si el email se envió
4. **Reenviar entradas:** Implementar endpoint para reenviar email (opcional)

### Endpoint sugerido para reenviar (a implementar):
```javascript
POST /tickets/resend-email
Authorization: Bearer {TOKEN}
{
  "reservationId": 1
}
```

---

## ✅ Resumen Final

**El frontend NO necesita:**
- ❌ Generar códigos QR
- ❌ Enviar emails
- ❌ Configurar SMTP
- ❌ Manejar plantillas de email
- ❌ Adjuntar archivos

**El frontend SOLO necesita:**
- ✅ Recolectar el email del usuario
- ✅ Llamar a `POST /tickets/pay`
- ✅ Mostrar confirmación y los QR codes
- ✅ Informar que el email fue enviado

**El backend hace TODO el resto automáticamente.** 🚀

---

## 🎨 Mensajes Sugeridos para la UI

### Después del pago exitoso:
```
🎉 ¡Compra completada con éxito!

📧 Hemos enviado tus entradas a: usuario@ejemplo.com

Revisa tu correo electrónico para ver tus códigos QR.
También puedes descargarlos aquí abajo.

⚠️ Importante:
• Guarda los QR codes en tu dispositivo
• Preséntalos en la entrada del evento
• Cada código es de un solo uso
• Revisa la carpeta de spam si no ves el email
```

### Durante el proceso de pago:
```
⏳ Procesando tu pago...

Al finalizar, recibirás tus entradas por email con los códigos QR.
```

---

¿Necesitas ayuda con la integración? El backend está listo y funcionando. 
Solo falta que el frontend llame a los endpoints correctos. 📧✨
