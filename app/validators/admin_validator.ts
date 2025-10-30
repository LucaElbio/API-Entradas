import vine from '@vinejs/vine'

/**
 * Validator para el registro de administradores
 * Según criterios de aceptación:
 * - Nombre, apellido, email y contraseña
 * - Email no registrado previamente
 * - Contraseña con mínimo 8 caracteres, al menos una mayúscula y un número
 */
export const registerAdminValidator = vine.compile(
  vine.object({
    // Nombre (required)
    firstName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
      .escape(),

    // Apellido (required)
    lastName: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
      .escape(),

    // Email único (required)
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),

    // Contraseña con requisitos específicos:
    // - Mínimo 8 caracteres
    // - Al menos una mayúscula
    // - Al menos un número
    password: vine
      .string()
      .minLength(8)
      .maxLength(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]*$/),

    // DNI opcional para administradores
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

    // Company ID opcional (se asignará automáticamente si no se provee)
    companyId: vine.number().optional(),
  })
)

/**
 * Validator para el login de administradores
 */
export const loginAdminValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(1),
  })
)

/**
 * Mensajes de error personalizados en español
 */
export const adminValidationMessages = {
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

  'email.required': 'El email es obligatorio',
  'email.string': 'El email debe ser una cadena de texto',
  'email.email': 'Debe proporcionar un email válido',
  'email.unique': 'Este email ya está registrado',

  'password.required': 'La contraseña es obligatoria',
  'password.string': 'La contraseña debe ser una cadena de texto',
  'password.minLength': 'La contraseña debe tener al menos 8 caracteres',
  'password.maxLength': 'La contraseña no puede tener más de 128 caracteres',
  'password.regex':
    'La contraseña debe contener al menos una mayúscula, una minúscula y un número',

  'dni.string': 'El DNI debe ser una cadena de texto',
  'dni.minLength': 'El DNI debe tener al menos 7 dígitos',
  'dni.maxLength': 'El DNI no puede tener más de 10 dígitos',
  'dni.regex': 'El DNI solo puede contener números',
  'dni.unique': 'Este DNI ya está registrado',

  'companyId.number': 'El ID de compañía debe ser un número',
}
