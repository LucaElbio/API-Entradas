/**
 * Utilidad para crear un mock de HttpContext de AdonisJS en pruebas
 */
export function createHttpContext({
  body = {},
  qs = {},
  user = null,
  params = {},
  headers = {} as Record<string, string>,
  ip = '127.0.0.1',
}: {
  body?: any
  qs?: any
  user?: any
  params?: any
  headers?: Record<string, string>
  ip?: string
} = {}) {
  const state: any = { statusCode: 200, responseBody: null }
  
  const response = {
    status: (code: number) => {
      state.statusCode = code
      return {
        json: (data: any) => {
          state.responseBody = data
          state.statusCode = code
          return { statusCode: code, body: data }
        },
      }
    },
    json: (data: any) => {
      state.statusCode = 200
      state.responseBody = data
      return { statusCode: 200, body: data }
    },
    created: (data: any) => {
      state.statusCode = 201
      state.responseBody = data
      return { statusCode: 201, body: data }
    },
    ok: (data: any) => {
      state.statusCode = 200
      state.responseBody = data
      return { statusCode: 200, body: data }
    },
    badRequest: (data: any) => {
      state.statusCode = 400
      state.responseBody = data
      return { statusCode: 400, body: data }
    },
    forbidden: (data: any) => {
      state.statusCode = 403
      state.responseBody = data
      return { statusCode: 403, body: data }
    },
    notFound: (data: any) => {
      state.statusCode = 404
      state.responseBody = data
      return { statusCode: 404, body: data }
    },
    internalServerError: (data: any) => {
      state.statusCode = 500
      state.responseBody = data
      return { statusCode: 500, body: data }
    },
    setHeader: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    hasHeader: jest.fn().mockReturnValue(false),
    removeHeader: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  
  const request = {
    only: (fields: string[]) => {
      const result: any = {}
      fields.forEach((field) => {
        if (field in body) {
          result[field] = body[field]
        }
      })
      return result
    },
    all: () => body,
    input: (key: string, defaultValue?: any) => body[key] ?? defaultValue,
    body: () => body,
    qs: () => qs,
    header: (key: string) => headers[key?.toLowerCase()] ?? headers[key] ?? null,
    file: jest.fn().mockReturnValue(null),
    ip: () => ip,
    headers: () => headers,
  }
  
  const auth = {
    user: user,
    isAuthenticated: !!user,
  }
  
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
  
  return { request, response, auth, params, logger, state }
}
