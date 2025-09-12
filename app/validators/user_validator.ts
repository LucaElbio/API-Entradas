import vine from '@vinejs/vine'

/**
 * Validator para el registro de usuarios
 * Según criterios de aceptación: nombre, apellido, email, DNI y contraseña
 * - Validar email único y DNI válido
 * - Contraseña segura (mínimo 8 caracteres, una mayúscula, un número)
 */
export const registerUserValidator = vine.compile(
  vine.object({
    // Nombre (required según criterios de aceptación)
    firstName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
      .escape(),

    // Apellido (required según criterios de aceptación)
    lastName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
      .escape(),

    // Campos opcionales para asignación de company y role
    companyId: vine.number().optional(),
    roleId: vine.number().optional(),

    // Email único (required según criterios de aceptación)
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),

    // DNI válido (required según criterios de aceptación)
    dni: vine
      .string()
      .trim()
      .minLength(7)
      .maxLength(10)
      .regex(/^\d+$/)
      .unique(async (db, value) => {
        const user = await db.from('users').where('dni', value).first()
        return !user
      }),

    // Contraseña segura (mínimo 8 caracteres, una mayúscula, un número)
    password: vine
      .string()
      .minLength(8)
      .maxLength(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]*$/),
  })
)

/**
 * Validator para el login de usuarios
 */
export const loginUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(1),
  })
)

/**
 * Mensajes de error personalizados en español
 */
export const validationMessages = {
  'firstName.required': 'El nombre es obligatorio',
  'firstName.string': 'El nombre debe ser una cadena de texto',
  'firstName.minLength': 'El nombre debe tener al menos 2 caracteres',
  'firstName.maxLength': 'El nombre no puede tener más de 50 caracteres',
  'firstName.regex': 'El nombre solo puede contener letras y espacios',

  'lastName.required': 'El apellido es obligatorio',
  'lastName.string': 'El apellido debe ser una cadena de texto',
  'lastName.minLength': 'El apellido debe tener al menos 2 caracteres',
  'lastName.maxLength': 'El apellido no puede tener más de 50 caracteres',
  'lastName.regex': 'El apellido solo puede contener letras y espacios',

  'companyId.number': 'El ID de compañía debe ser un número',
  'roleId.number': 'El ID de rol debe ser un número',

  'email.required': 'El email es obligatorio',
  'email.string': 'El email debe ser una cadena de texto',
  'email.email': 'Debe proporcionar un email válido',
  'email.unique': 'Este email ya está registrado',

  'dni.required': 'El DNI es obligatorio',
  'dni.string': 'El DNI debe ser una cadena de texto',
  'dni.minLength': 'El DNI debe tener al menos 7 dígitos',
  'dni.maxLength': 'El DNI no puede tener más de 10 dígitos',
  'dni.regex': 'El DNI solo puede contener números',
  'dni.unique': 'Este DNI ya está registrado',

  'password.required': 'La contraseña es obligatoria',
  'password.string': 'La contraseña debe ser una cadena de texto',
  'password.minLength': 'La contraseña debe tener al menos 8 caracteres',
  'password.maxLength': 'La contraseña no puede tener más de 128 caracteres',
  'password.regex':
    'La contraseña debe contener al menos: una minúscula, una mayúscula y un número',
}
