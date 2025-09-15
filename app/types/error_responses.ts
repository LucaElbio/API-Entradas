/**
 * Tipos estándar para respuestas de error
 * Aseguran consistencia en toda la aplicación
 */

export interface BaseErrorResponse {
  message: string
  error: string
  timestamp?: string
}

export interface ValidationErrorResponse extends BaseErrorResponse {
  error: 'VALIDATION_ERROR'
  errors: Array<{
    rule: string
    field: string
    message: string
  }>
}

export interface AuthenticationErrorResponse extends BaseErrorResponse {
  error: 'UNAUTHORIZED' | 'INVALID_CREDENTIALS' | 'AUTHENTICATION_REQUIRED'
}

export interface AuthorizationErrorResponse extends BaseErrorResponse {
  error: 'INSUFFICIENT_PERMISSIONS' | 'NO_ROLE_ASSIGNED' | 'COMPANY_ACCESS_DENIED'
  requiredRoles?: string[]
  userRole?: string
}

export interface RateLimitErrorResponse extends BaseErrorResponse {
  error: 'RATE_LIMIT_EXCEEDED'
  retryAfter: number
}

export interface NotFoundErrorResponse extends BaseErrorResponse {
  error: 'ROUTE_NOT_FOUND' | 'RESOURCE_NOT_FOUND'
}

export interface ServerErrorResponse extends BaseErrorResponse {
  error: 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE' | 'ROLE_VERIFICATION_ERROR'
  details?: string
}

export interface TokenErrorResponse extends BaseErrorResponse {
  error: 'INVALID_TOKEN' | 'TOKEN_EXPIRED'
}

/**
 * Union type para todas las respuestas de error posibles
 */
export type ErrorResponse =
  | ValidationErrorResponse
  | AuthenticationErrorResponse
  | AuthorizationErrorResponse
  | RateLimitErrorResponse
  | NotFoundErrorResponse
  | ServerErrorResponse
  | TokenErrorResponse

/**
 * Códigos de error estándar de la aplicación
 */
export const ERROR_CODES = {
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Autenticación
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Autorización
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  NO_ROLE_ASSIGNED: 'NO_ROLE_ASSIGNED',
  COMPANY_ACCESS_DENIED: 'COMPANY_ACCESS_DENIED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Recursos
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Servidor
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  ROLE_VERIFICATION_ERROR: 'ROLE_VERIFICATION_ERROR',
} as const

/**
 * Status codes HTTP estándar para cada tipo de error
 */
export const ERROR_STATUS_CODES = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.INVALID_CREDENTIALS]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.AUTHENTICATION_REQUIRED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
  [ERROR_CODES.NO_ROLE_ASSIGNED]: 403,
  [ERROR_CODES.COMPANY_ACCESS_DENIED]: 403,
  [ERROR_CODES.ROUTE_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.ROLE_VERIFICATION_ERROR]: 500,
} as const

/**
 * Helper function para crear respuestas de error consistentes
 */
export function createErrorResponse(
  errorCode: keyof typeof ERROR_CODES,
  message: string,
  additionalData?: Record<string, any>
): ErrorResponse {
  const baseResponse: BaseErrorResponse = {
    message,
    error: ERROR_CODES[errorCode],
    timestamp: new Date().toISOString(),
  }

  return {
    ...baseResponse,
    ...additionalData,
  } as ErrorResponse
}
