# 🔒 SISTEMA DE AUTENTICACIÓN SEGURO - DOCUMENTACIÓN DE SEGURIDAD

## 📋 RESUMEN

Se ha implementado un sistema de autenticación robusto y seguro utilizando JWT (JSON Web Tokens) con múltiples capas de protección contra amenazas comunes de seguridad.

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD IMPLEMENTADAS

### 1. **Autenticación JWT Segura**
- **Tokens con expiración**: 24 horas por defecto
- **Hashing de contraseñas**: bcrypt con salt automático
- **Rotación de tokens**: Endpoint de refresh automático
- **Invalidación inmediata**: Logout elimina tokens de la base de datos

### 2. **Rate Limiting Inteligente**
- **Protección contra fuerza bruta**: Máximo 5 intentos por IP en 15 minutos
- **Bloqueo progresivo**: 30 minutos de bloqueo después de exceder límite
- **Limpieza automática**: Intentos exitosos limpian el contador
- **Logs detallados**: Registro completo de intentos fallidos

### 3. **Validaciones de Contraseñas Avanzadas**
- **Complejidad mínima**: 8 caracteres, mayúscula, minúscula, número y símbolo especial
- **Caracteres permitidos**: `@$!%*?&` como símbolos especiales
- **Longitud máxima**: 128 caracteres para prevenir DoS
- **Regex de seguridad**: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$`

### 4. **Validaciones de Unicidad de Datos**
- **Email único**: Validación automática en base de datos para prevenir duplicados
- **DNI único**: Verificación de unicidad para evitar registros duplicados
- **Validación en tiempo real**: Se ejecuta durante el proceso de registro
- **Mensajes descriptivos**: Errores claros cuando se detectan duplicados
- **Normalización de email**: Emails se normalizan antes de validar unicidad

### 5. **Sistema de Roles y Permisos**
- **Roles definidos**: ADMIN, MANAGER, USER 
- **Middleware de roles**: Verificación automática de permisos
- **Separación por compañía**: Los usuarios solo acceden a su compañía
- **Helpers predefinidos**: Funciones para verificación rápida de roles

### 6. **Logging y Auditoría Completa**
- **Eventos registrados**:
  - Intentos de login (exitosos y fallidos)
  - Registros de usuarios
  - Accesos a perfiles
  - Logouts
  - Refresh de tokens
  - Errores de autenticación
  - Intentos de registro con datos duplicados
- **Información capturada**: IP, User-Agent, timestamp, detalles del usuario

### 7. **Middleware de Seguridad**
- **AuthMiddleware**: Validación de tokens JWT
- **RateLimitMiddleware**: Protección contra ataques de fuerza bruta
- **RoleMiddleware**: Verificación de permisos y roles
- **ForceJsonMiddleware**: Respuestas consistentes en JSON

## 🚀 ENDPOINTS DISPONIBLES

### **Públicos (Sin autenticación)**
```
GET  /                    - Endpoint de salud
POST /usuarios/registro   - Registro de nuevos usuarios
```

### **Rate Limited (Protegidos contra fuerza bruta)**
```
POST /usuarios/login      - Inicio de sesión con rate limiting
```

### **Protegidos (Requieren JWT válido)**
```
GET  /auth/me            - Perfil del usuario autenticado
POST /auth/logout        - Cerrar sesión
POST /auth/refresh       - Renovar token de acceso
```

## 🔧 USO DE MIDDLEWARES

### **Rate Limiting**
```typescript
// Aplicar a rutas específicas
router
  .group(() => {
    router.post('/usuarios/login', '#controllers/users_controller.login')
  })
  .use(middleware.rateLimit())
```

### **Autenticación**
```typescript
// Proteger rutas
router
  .group(() => {
    router.get('/auth/me', '#controllers/users_controller.me')
  })
  .use(middleware.auth())
```

### **Roles y Permisos**
```typescript
// Verificar roles específicos
router
  .group(() => {
    router.get('/admin/users', '#controllers/admin_controller.users')
  })
  .use([
    middleware.auth(),
    middleware.role(RoleMiddleware.adminOnly())
  ])

// Helpers disponibles:
RoleMiddleware.admin()           // Solo ADMIN
RoleMiddleware.manager()         // MANAGER y ADMIN
RoleMiddleware.user()            // USER, MANAGER y ADMIN
RoleMiddleware.adminOnly()       // Solo ADMIN
RoleMiddleware.managerOrAdmin()  // MANAGER y ADMIN
RoleMiddleware.sameCompany()     // Verificar misma compañía
```

## 📊 ESTRUCTURA DE RESPUESTAS

### **Login Exitoso**
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "oat_1.abc123...",
  "expiresAt": "2025-09-16T12:00:00.000Z",
  "user": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "dni": "12345678",
    "companyId": 1,
    "roleId": 2,
    "createdAt": "2025-09-15T12:00:00.000Z"
  }
}
```

### **Rate Limit Excedido**
```json
{
  "message": "Demasiados intentos de inicio de sesión. Intente nuevamente en 29 minutos.",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 29
}
```

### **Error de Autenticación**
```json
{
  "message": "No autorizado. Se requiere autenticación válida.",
  "error": "UNAUTHORIZED"
}
```

### **Error de Permisos**
```json
{
  "message": "Permisos insuficientes para acceder a este recurso",
  "error": "INSUFFICIENT_PERMISSIONS",
  "requiredRoles": ["ADMIN"],
  "userRole": "USER"
}
```

### **Error de Validación - Datos Duplicados**
```json
{
  "message": "Error de validación",
  "errors": [
    {
      "rule": "unique",
      "field": "email",
      "message": "Este email ya está registrado"
    }
  ]
}
```

### **Error de Validación - DNI Duplicado**
```json
{
  "message": "Error de validación",
  "errors": [
    {
      "rule": "unique",
      "field": "dni",
      "message": "Este DNI ya está registrado"
    }
  ]
}
```

## 🔍 MONITOREO Y LOGS

### **Eventos de Seguridad Importantes**
- **Login fallido**: Usuario/contraseña incorrectos
- **Rate limit excedido**: Posible ataque de fuerza bruta
- **Token inválido**: Posible token comprometido
- **Acceso denegado**: Intento de acceso sin permisos
- **Registro duplicado**: Intento de registro con email o DNI ya existente

### **Campos Registrados**
```typescript
{
  userId?: number,
  email: string,
  ip: string,
  userAgent?: string,
  route: string,
  method: string,
  timestamp: string,
  error?: string,
  requiredRoles?: string[],
  userRole?: string
}
```

## ⚡ CONFIGURACIÓN DE ENTORNO

### **Variables Recomendadas**
```env
# Producción
APP_KEY=your-super-secret-key-here
NODE_ENV=production
LOG_LEVEL=warn

# Base de datos
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_DATABASE=apientradas
```

## 🚨 MEJORES PRÁCTICAS DE SEGURIDAD

### **Para Desarrolladores**
1. **Nunca hardcodear credentials**
2. **Usar HTTPS en producción**
3. **Validar todos los inputs**
4. **Implementar CORS apropiadamente**
5. **Mantener logs de seguridad**
6. **Rotar secrets regularmente**
7. **Usar manejo de errores consistente** (ver [ERROR_HANDLING_DOCUMENTATION.md](ERROR_HANDLING_DOCUMENTATION.md))

### **Para Usuarios**
1. **Contraseñas fuertes obligatorias**
2. **No reutilizar contraseñas**
3. **Cerrar sesión al terminar**
4. **Reportar actividad sospechosa**

### **Para Administradores**
1. **Monitorear logs de seguridad**
2. **Revisar intentos de fuerza bruta**
3. **Mantener sistema actualizado**
4. **Backup regular de la base de datos**
5. **Auditar permisos regularmente**
6. **Implementar alertas de errores** para detección temprana de problemas

## 🔄 MANTENIMIENTO

### **Limpieza Automática**
- **Tokens expirados**: Se eliminan automáticamente
- **Rate limiting**: Limpieza automática de registros antiguos
- **Logs**: Configurar rotación según necesidades

### **Monitoreo Continuo**
- **Métricas de autenticación**
- **Patrones de acceso anómalos**
- **Performance de endpoints**
- **Errores de seguridad**

## 📈 MÉTRICAS DE SEGURIDAD

El sistema registra métricas importantes para:
- **Tasa de login exitoso/fallido**
- **Frecuencia de rate limiting**
- **Distribución de roles de usuarios**
- **Patrones de uso de endpoints**
- **Errores de autenticación por hora/día**

---

## ✅ ESTADO DEL SISTEMA

**🟢 TOTALMENTE OPERATIVO** - Sistema de autenticación implementado con todas las características de seguridad requeridas.

**📊 Coverage**: Autenticación JWT ✅ | Rate Limiting ✅ | Roles ✅ | Logging ✅ | Validaciones ✅

**🎯 Alineado con ERD**: Roles (ADMIN/MANAGER/USER) ✅ | Compañías ✅ | Usuarios ✅