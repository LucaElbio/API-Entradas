# API de Entradas - Documentación de Usuarios

## Modelo de Usuario

### Atributos del Usuario
- **id**: Identificador único (autoincremental)
- **companyId**: ID de la compañía (clave foránea, opcional)
- **roleId**: ID del rol (clave foránea, opcional)  
- **firstName**: Nombre del usuario (2-50 caracteres, solo letras)
- **lastName**: Apellido del usuario (2-50 caracteres, solo letras) 
- **email**: Email único del usuario (validado y normalizado)
- **dni**: DNI único del usuario (7-10 dígitos numéricos)
- **password**: Contraseña hasheada (mínimo 8 caracteres, debe contener mayúscula, minúscula y número)
- **createdAt**: Fecha de creación (automática)
- **updatedAt**: Fecha de actualización (automática)

### Relaciones
- **Pertenece a Company**: Cada usuario pertenece a una compañía
- **Pertenece a Role**: Cada usuario tiene un rol asignado

## Endpoints de Autenticación

### POST /auth/register
Registra un nuevo usuario en el sistema.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez", 
  "email": "juan.perez@example.com",
  "dni": "12345678",
  "password": "Password123",
  "companyId": 1,
  "roleId": 2
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "dni": "12345678",
    "companyId": 1,
    "roleId": 2,
    "createdAt": "2025-09-10T10:00:00.000-03:00"
  }
}
```

**Validaciones:**
- **firstName**: Mínimo 2 caracteres, máximo 50, solo letras y espacios
- **lastName**: Mínimo 2 caracteres, máximo 50, solo letras y espacios
- **email**: Formato de email válido, único en el sistema
- **dni**: Entre 7-10 dígitos numéricos, único en el sistema
- **password**: Mínimo 8 caracteres, debe contener al menos una mayúscula, una minúscula y un número
- **companyId**: Opcional, debe ser un número válido (por defecto: 1)
- **roleId**: Opcional, debe ser un número válido (por defecto: 2 - Usuario)

### POST /auth/login
Inicia sesión de un usuario existente.

**Body:**
```json
{
  "email": "juan.perez@example.com",
  "password": "Password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "oat_1.abc123...",
  "user": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "dni": "12345678",
    "companyId": 1,
    "roleId": 2,
    "createdAt": "2025-09-10T10:00:00.000-03:00"
  }
}
```

## Endpoints Protegidos
Los siguientes endpoints requieren autenticación mediante Bearer Token.

### GET /auth/me
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer oat_1.abc123...
```

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": 1,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "dni": "12345678",
    "companyId": 1,
    "roleId": 2,
    "createdAt": "2025-09-10T10:00:00.000-03:00"
  }
}
```

### POST /auth/logout
Cierra la sesión del usuario autenticado.

**Headers:**
```
Authorization: Bearer oat_1.abc123...
```

**Respuesta exitosa (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## Códigos de Error

### 400 - Bad Request
Se retorna cuando hay errores de validación o credenciales inválidas.

**Ejemplo - Error de validación:**
```json
{
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "Este email ya está registrado"
    }
  ]
}
```

**Ejemplo - Credenciales inválidas:**
```json
{
  "message": "Credenciales inválidas"
}
```

### 401 - Unauthorized
Se retorna cuando se intenta acceder a un endpoint protegido sin autenticación válida.

### 500 - Internal Server Error
Se retorna cuando hay un error interno del servidor.

```json
{
  "message": "Error interno del servidor"
}
```

## Ejecución de Tests

Para ejecutar los tests del módulo de usuarios:

```bash
node ace test tests/functional/users/
```

Para ejecutar todos los tests:

```bash
node ace test
```

## Seguridad

- Las contraseñas se hashean usando scrypt antes de guardarse en la base de datos
- Los tokens de acceso tienen expiración automática
- Se valida la unicidad de email y DNI a nivel de base de datos y aplicación
- Los emails se normalizan automáticamente (lowercase, trim espacios)
- Se sanitizan los inputs para prevenir inyecciones
