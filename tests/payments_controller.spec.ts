/**
 * Tests para PaymentsController
 *
 * Cobertura:
 * - Completar pago exitoso → verificar generación de entradas
 * - Pago rechazado (reserva expirada) → mantener entradas en estado reservado
 * - Validaciones de negocio (estado, stock, expiración)
 */

import { DateTime } from 'luxon'

// =============================================================================
// MOCKS
// =============================================================================

/**
 * Mock del servicio de transacciones de base de datos
 */
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@adonisjs/lucid/services/db', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(() => mockTransaction),
  },
}))

/**
 * Mock de modelos de base de datos con query builder
 */
const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  preload: jest.fn().mockReturnThis(),
  firstOrFail: jest.fn(),
  first: jest.fn(),
})

// Mock de Reservation
const mockReservationQuery = createMockQueryBuilder()
jest.mock('#models/reservation', () => ({
  __esModule: true,
  default: {
    query: jest.fn(() => mockReservationQuery),
    create: jest.fn(),
  },
}))

// Mock de ReservationStatus
const mockReservationStatusQuery = createMockQueryBuilder()
jest.mock('#models/reservation_status', () => ({
  __esModule: true,
  default: {
    query: jest.fn(() => mockReservationStatusQuery),
  },
}))

// Mock de PaymentStatus
const mockPaymentStatusQuery = createMockQueryBuilder()
jest.mock('#models/payment_status', () => ({
  __esModule: true,
  default: {
    query: jest.fn(() => mockPaymentStatusQuery),
  },
}))

// Mock de TicketStatus
const mockTicketStatusQuery = createMockQueryBuilder()
jest.mock('#models/ticket_status', () => ({
  __esModule: true,
  default: {
    query: jest.fn(() => mockTicketStatusQuery),
  },
}))

// Mock de Payment
const mockPaymentModel = {
  create: jest.fn(),
}
jest.mock('#models/payment', () => ({
  __esModule: true,
  default: mockPaymentModel,
}))

// Mock de Ticket
const mockTicketModel = {
  create: jest.fn(),
}
jest.mock('#models/ticket', () => ({
  __esModule: true,
  default: mockTicketModel,
}))

/**
 * Mock del servicio de QR
 */
const mockQrService = {
  generateTicketQR: jest.fn(),
  verifyQRCode: jest.fn(),
}
jest.mock('#services/qr_service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockQrService),
}))

/**
 * Mock del servicio de email
 */
const mockMailService = {
  sendPurchaseConfirmation: jest.fn().mockResolvedValue(true),
}
jest.mock('#services/mail_service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockMailService),
}))

// Importar el controlador después de los mocks
const PaymentsController = require('#controllers/Http/payments_controller').default

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Crea un contexto HTTP simulado para los tests
 */
function createHttpContext({ request = {}, auth = {} as any } = {}) {
  const state: any = { status: 0, body: null }

  const response = {
    json: (data: any) => {
      state.status = state.status || 200
      state.body = data
      return { statusCode: state.status, body: data }
    },
    ok: (data: any) => {
      state.status = 200
      state.body = data
      return { statusCode: 200, body: data }
    },
    badRequest: (data: any) => {
      state.status = 400
      state.body = data
      return { statusCode: 400, body: data }
    },
    notFound: (data: any) => {
      state.status = 404
      state.body = data
      return { statusCode: 404, body: data }
    },
    internalServerError: (data: any) => {
      state.status = 500
      state.body = data
      return { statusCode: 500, body: data }
    },
    status: (code: number) => {
      state.status = code
      return {
        json: (data: any) => {
          state.body = data
          return { statusCode: code, body: data }
        },
      }
    },
  }

  return {
    request: {
      only: (keys: string[]) => request,
      ...request,
    },
    response,
    auth,
    state,
  }
}

/**
 * Crea una reserva mock con relaciones
 */
function createMockReservation(overrides: any = {}) {
  const now = DateTime.now()

  return {
    id: 1,
    userId: 5,
    eventId: 10,
    statusId: 1,
    quantity: 2,
    totalAmount: 5000,
    expiresAt: now.plus({ minutes: 15 }),
    createdAt: now,
    updatedAt: now,
    save: jest.fn().mockResolvedValue(undefined),
    useTransaction: jest.fn(),
    user: {
      id: 5,
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@test.com',
    },
    event: {
      id: 10,
      title: 'Concierto Rock 2025',
      description: 'Gran concierto de rock',
      price: 2500,
      ticketsAvailable: 50,
      ticketsTotal: 100,
      datetime: now.plus({ days: 30 }),
      venue: {
        name: 'Estadio Central',
        address: 'Av. Principal 123',
      },
      useTransaction: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    },
    status: {
      id: 1,
      code: 'PENDING',
      name: 'Pendiente',
    },
    ...overrides,
  }
}

/**
 * Crea un ticket mock
 */
function createMockTicket(id: number, reservationId: number, eventId: number, userId: number) {
  return {
    id,
    reservationId,
    eventId,
    ownerId: userId,
    statusId: 1,
    qrCode: 'TEMP',
    qrImageUrl: null,
    usedAt: null,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    save: jest.fn().mockResolvedValue(undefined),
  }
}

// =============================================================================
// TESTS - PAGO EXITOSO
// =============================================================================

describe('PaymentsController - Completar pago exitoso', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Debe procesar el pago y generar las entradas correctamente', async () => {
    // Arrange - Preparar datos
    const controller = new PaymentsController()
    const reservation = createMockReservation()

    // Mock de estados
    const pendingStatus = { id: 1, code: 'PENDING', name: 'Pendiente' }
    const paidStatus = { id: 2, code: 'PAID', name: 'Pagado' }
    const approvedPaymentStatus = { id: 1, code: 'APPROVED', name: 'Aprobado' }
    const activeTicketStatus = { id: 1, code: 'ACTIVE', name: 'Activo' }

    // Mock de tickets creados
    const ticket1 = createMockTicket(101, 1, 10, 5)
    const ticket2 = createMockTicket(102, 1, 10, 5)

    // Configurar mocks
    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)

    mockReservationStatusQuery.firstOrFail
      .mockResolvedValueOnce(pendingStatus) // Para validación PENDING
      .mockResolvedValueOnce(paidStatus) // Para cambiar a PAID

    mockPaymentStatusQuery.firstOrFail.mockResolvedValueOnce(approvedPaymentStatus)
    mockTicketStatusQuery.firstOrFail.mockResolvedValueOnce(activeTicketStatus)

    // Mock de creación de payment
    const mockPayment = {
      id: 50,
      reservationId: 1,
      statusId: approvedPaymentStatus.id,
      amount: 5000,
      provider: 'SIMULATED_GATEWAY',
      externalRef: 'PAY-123456-1',
    }
    mockPaymentModel.create.mockResolvedValueOnce(mockPayment)

    // Mock de creación de tickets
    mockTicketModel.create.mockResolvedValueOnce(ticket1).mockResolvedValueOnce(ticket2)

    // Mock de generación de QR (cada ticket tiene QR único)
    mockQrService.generateTicketQR
      .mockResolvedValueOnce({
        qrCode: '101-10-5-uuid-1111-aaaa',
        qrImageUrl: 'data:image/png;base64,QR1_IMAGE_DATA',
      })
      .mockResolvedValueOnce({
        qrCode: '102-10-5-uuid-2222-bbbb',
        qrImageUrl: 'data:image/png;base64,QR2_IMAGE_DATA',
      })

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    // Act - Ejecutar
    const result = await controller.pay(ctx as any)

    // Assert - Verificar
    expect(result.statusCode).toBe(200)
    expect(result.body.message).toBe('Pago procesado exitosamente')

    // Verificar que la reserva cambió a PAID
    expect(reservation.statusId).toBe(paidStatus.id)
    expect(reservation.save).toHaveBeenCalled()

    // Verificar que se creó el pago con estado APPROVED
    expect(mockPaymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationId: 1,
        statusId: approvedPaymentStatus.id,
        amount: 5000,
        provider: 'SIMULATED_GATEWAY',
      }),
      expect.any(Object)
    )

    // Verificar que se generaron 2 tickets (según quantity)
    expect(mockTicketModel.create).toHaveBeenCalledTimes(2)

    // Verificar que cada ticket tiene su QR único
    expect(mockQrService.generateTicketQR).toHaveBeenCalledTimes(2)
    expect(mockQrService.generateTicketQR).toHaveBeenNthCalledWith(1, 101, 10, 5)
    expect(mockQrService.generateTicketQR).toHaveBeenNthCalledWith(2, 102, 10, 5)

    // Verificar que los tickets fueron actualizados con sus QR
    expect(ticket1.qrCode).toBe('101-10-5-uuid-1111-aaaa')
    expect(ticket1.qrImageUrl).toBe('data:image/png;base64,QR1_IMAGE_DATA')
    expect(ticket2.qrCode).toBe('102-10-5-uuid-2222-bbbb')
    expect(ticket2.qrImageUrl).toBe('data:image/png;base64,QR2_IMAGE_DATA')

    // Verificar que los tickets se guardaron
    expect(ticket1.save).toHaveBeenCalled()
    expect(ticket2.save).toHaveBeenCalled()

    // Verificar que se envió el email de confirmación
    expect(mockMailService.sendPurchaseConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          email: 'juan.perez@test.com',
        }),
        tickets: expect.arrayContaining([
          expect.objectContaining({
            id: 101,
            qrCode: '101-10-5-uuid-1111-aaaa',
          }),
          expect.objectContaining({
            id: 102,
            qrCode: '102-10-5-uuid-2222-bbbb',
          }),
        ]),
      })
    )

    // Verificar que la transacción se commiteó
    expect(mockTransaction.commit).toHaveBeenCalled()

    // Verificar respuesta con tickets generados
    expect(result.body.data.tickets).toHaveLength(2)
    expect(result.body.data.tickets[0]).toMatchObject({
      id: 101,
      qrCode: '101-10-5-uuid-1111-aaaa',
      status: 'ACTIVE',
    })
    expect(result.body.data.tickets[1]).toMatchObject({
      id: 102,
      qrCode: '102-10-5-uuid-2222-bbbb',
      status: 'ACTIVE',
    })
  })

  it('Debe validar que reservation_id es requerido', async () => {
    const controller = new PaymentsController()
    const ctx = createHttpContext({
      request: {},
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(400)
    expect(result.body.message).toBe('El campo reservation_id es requerido')
  })

  it('Debe validar que la cantidad de tickets sea mayor a 0', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({ quantity: 0 })

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(400)
    expect(result.body.message).toBe('La cantidad de tickets debe ser mayor a 0')
  })

  it('Debe validar el máximo de tickets por compra (10)', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({ quantity: 15 })

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(400)
    expect(result.body.message).toContain('No se pueden comprar más de 10 tickets')
  })

  it('Debe validar stock disponible en el evento', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({
      quantity: 10,
      event: {
        ...createMockReservation().event,
        ticketsAvailable: 5, // Solo 5 disponibles
      },
    })

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(400)
    expect(result.body.message).toContain('No hay suficientes tickets disponibles')
  })

  it('Debe validar que la reserva esté en estado PENDING', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({
      statusId: 2, // No es PENDING
      status: { id: 2, code: 'PAID', name: 'Pagado' },
    })

    const pendingStatus = { id: 1, code: 'PENDING', name: 'Pendiente' }

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)
    mockReservationStatusQuery.firstOrFail.mockResolvedValueOnce(pendingStatus)

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(400)
    expect(result.body.message).toBe('La reserva no está en estado pendiente')
  })
})

// =============================================================================
// TESTS - PAGO RECHAZADO (RESERVA EXPIRADA)
// =============================================================================

describe('PaymentsController - Pago rechazado (reserva expirada)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Debe rechazar pago si la reserva está expirada y marcarla como EXPIRED', async () => {
    // Arrange
    const controller = new PaymentsController()
    const reservation = createMockReservation({
      expiresAt: DateTime.now().minus({ minutes: 5 }), // Expirada hace 5 minutos
    })

    const pendingStatus = { id: 1, code: 'PENDING', name: 'Pendiente' }
    const expiredStatus = { id: 3, code: 'EXPIRED', name: 'Expirado' }

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)
    mockReservationStatusQuery.firstOrFail
      .mockResolvedValueOnce(pendingStatus)
      .mockResolvedValueOnce(expiredStatus)

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    // Act
    const result = await controller.pay(ctx as any)

    // Assert
    expect(result.statusCode).toBe(400)
    expect(result.body.error).toBe('Reservation expired')
    expect(result.body.message).toBe('La reserva ha expirado')

    // Verificar que la reserva cambió a EXPIRED
    expect(reservation.statusId).toBe(expiredStatus.id)
    expect(reservation.save).toHaveBeenCalled()

    // Verificar que la transacción se commiteó (para guardar el estado EXPIRED)
    expect(mockTransaction.commit).toHaveBeenCalled()

    // Verificar que NO se crearon tickets
    expect(mockTicketModel.create).not.toHaveBeenCalled()

    // Verificar que NO se generaron QR
    expect(mockQrService.generateTicketQR).not.toHaveBeenCalled()

    // Verificar que NO se envió email de confirmación
    expect(mockMailService.sendPurchaseConfirmation).not.toHaveBeenCalled()
  })

  it('Debe manejar error 404 cuando la reserva no existe', async () => {
    const controller = new PaymentsController()

    // Simular error de "not found" de Lucid
    const notFoundError = new Error('Row not found')
    ;(notFoundError as any).code = 'E_ROW_NOT_FOUND'

    mockReservationQuery.firstOrFail.mockRejectedValueOnce(notFoundError)

    const ctx = createHttpContext({
      request: { reservation_id: 999 },
    })

    const result = await controller.pay(ctx as any)

    expect(result.statusCode).toBe(404)
    expect(result.body.error).toBe('Not found')
    expect(result.body.message).toBe('Reserva no encontrada')

    // Verificar que la transacción se hizo rollback
    expect(mockTransaction.rollback).toHaveBeenCalled()
  })

  it('Debe hacer rollback en caso de error inesperado', async () => {
    const controller = new PaymentsController()

    // Simular error inesperado
    mockReservationQuery.firstOrFail.mockRejectedValueOnce(new Error('Database error'))

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    // Verificar que la transacción se hizo rollback
    expect(mockTransaction.rollback).toHaveBeenCalled()

    // Verificar que se retorna un error 500
    expect(result.statusCode).toBe(500)
  })
})

// =============================================================================
// TESTS - INTEGRACIÓN
// =============================================================================

describe('PaymentsController - Tests de integración', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Debe generar múltiples tickets con QR únicos en una sola transacción', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({ quantity: 5 })

    const pendingStatus = { id: 1, code: 'PENDING', name: 'Pendiente' }
    const paidStatus = { id: 2, code: 'PAID', name: 'Pagado' }
    const approvedPaymentStatus = { id: 1, code: 'APPROVED', name: 'Aprobado' }
    const activeTicketStatus = { id: 1, code: 'ACTIVE', name: 'Activo' }

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)
    mockReservationStatusQuery.firstOrFail
      .mockResolvedValueOnce(pendingStatus)
      .mockResolvedValueOnce(paidStatus)
    mockPaymentStatusQuery.firstOrFail.mockResolvedValueOnce(approvedPaymentStatus)
    mockTicketStatusQuery.firstOrFail.mockResolvedValueOnce(activeTicketStatus)

    mockPaymentModel.create.mockResolvedValueOnce({
      id: 50,
      reservationId: 1,
      statusId: approvedPaymentStatus.id,
      amount: 12500,
      provider: 'SIMULATED_GATEWAY',
      externalRef: 'PAY-123456-1',
    })

    // Crear 5 tickets diferentes
    const tickets = Array.from({ length: 5 }, (_, i) => createMockTicket(100 + i, 1, 10, 5))

    tickets.forEach((ticket, index) => {
      mockTicketModel.create.mockResolvedValueOnce(ticket)
      mockQrService.generateTicketQR.mockResolvedValueOnce({
        qrCode: `${ticket.id}-10-5-uuid-${index}`,
        qrImageUrl: `data:image/png;base64,QR${index}_IMAGE`,
      })
    })

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    // Verificar que se generaron 5 tickets
    expect(mockTicketModel.create).toHaveBeenCalledTimes(5)

    // Verificar que cada ticket tiene su QR único
    expect(mockQrService.generateTicketQR).toHaveBeenCalledTimes(5)

    // Verificar que todos los QR son diferentes
    const qrCodes = result.body.data.tickets.map((t: any) => t.qrCode)
    const uniqueQRs = new Set(qrCodes)
    expect(uniqueQRs.size).toBe(5) // Todos los QR son únicos

    // Verificar que la transacción se commiteó una sola vez
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1)
  })

  it('Debe continuar el proceso aunque falle el envío de email', async () => {
    const controller = new PaymentsController()
    const reservation = createMockReservation({ quantity: 1 })

    const pendingStatus = { id: 1, code: 'PENDING', name: 'Pendiente' }
    const paidStatus = { id: 2, code: 'PAID', name: 'Pagado' }
    const approvedPaymentStatus = { id: 1, code: 'APPROVED', name: 'Aprobado' }
    const activeTicketStatus = { id: 1, code: 'ACTIVE', name: 'Activo' }

    mockReservationQuery.firstOrFail.mockResolvedValueOnce(reservation)
    mockReservationStatusQuery.firstOrFail
      .mockResolvedValueOnce(pendingStatus)
      .mockResolvedValueOnce(paidStatus)
    mockPaymentStatusQuery.firstOrFail.mockResolvedValueOnce(approvedPaymentStatus)
    mockTicketStatusQuery.firstOrFail.mockResolvedValueOnce(activeTicketStatus)

    mockPaymentModel.create.mockResolvedValueOnce({
      id: 50,
      reservationId: 1,
      statusId: approvedPaymentStatus.id,
      amount: 2500,
      provider: 'SIMULATED_GATEWAY',
      externalRef: 'PAY-123456-1',
    })

    const ticket = createMockTicket(101, 1, 10, 5)
    mockTicketModel.create.mockResolvedValueOnce(ticket)
    mockQrService.generateTicketQR.mockResolvedValueOnce({
      qrCode: '101-10-5-uuid-aaaa',
      qrImageUrl: 'data:image/png;base64,QR_IMAGE',
    })

    // Simular error en el envío de email
    mockMailService.sendPurchaseConfirmation.mockRejectedValueOnce(new Error('SMTP error'))

    const ctx = createHttpContext({
      request: { reservation_id: 1 },
    })

    const result = await controller.pay(ctx as any)

    // El pago debe completarse exitosamente a pesar del error del email
    expect(result.statusCode).toBe(200)
    expect(result.body.message).toBe('Pago procesado exitosamente')
    expect(mockTransaction.commit).toHaveBeenCalled()
  })
})
