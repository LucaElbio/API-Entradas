/**
 * Tests para MailService
 * 
 * Cobertura:
 * - Verificar envío de email de confirmación de compra
 * - Validar que el email incluye los QR códigos correctos
 * - Verificar formato y contenido del email
 * - Manejo de errores en el envío
 */

import { DateTime } from 'luxon'

// =============================================================================
// MOCKS
// =============================================================================

// Mock nodemailer usando el mock manual
jest.mock('nodemailer')

// Importar nodemailer para acceder a los mocks
const nodemailerMock = jest.requireMock('nodemailer')
const mockSendMail = nodemailerMock.mockSendMail
const mockVerify = nodemailerMock.mockVerify

/**
 * Mock de variables de entorno
 */
jest.mock('#start/env', () => ({
  __esModule: true,
  default: {
    get: jest.fn((key: string, defaultValue?: string) => {
      const envVars: Record<string, string> = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@test.com',
        SMTP_PASSWORD: 'testpassword',
        MAIL_FROM_NAME: 'API Entradas Test',
        MAIL_FROM_ADDRESS: 'noreply@test.com',
      }
      return envVars[key] || defaultValue || ''
    }),
  },
}))

// Importar después de los mocks
import MailService from '../app/services/mail_service'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Crea datos de prueba para el email de confirmación
 */
function createPurchaseConfirmationData(overrides: any = {}) {
  const now = DateTime.now()

  return {
    user: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@test.com',
    },
    event: {
      title: 'Concierto Rock 2025',
      description: 'Gran concierto de rock',
      datetime: now.plus({ days: 30 }),
      venue: {
        name: 'Estadio Central',
        address: 'Av. Principal 123',
      },
      price: 2500,
    },
    tickets: [
      {
        id: 101,
        qrCode: '101-10-5-uuid-aaaa',
        qrImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
      },
      {
        id: 102,
        qrCode: '102-10-5-uuid-bbbb',
        qrImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
      },
    ],
    payment: {
      amount: 5000,
      externalRef: 'PAY-123456-1',
    },
    reservation: {
      id: 1,
      quantity: 2,
    },
    ...overrides,
  }
}

// =============================================================================
// TESTS - ENVÍO DE EMAIL DE CONFIRMACIÓN
// =============================================================================

describe('MailService - Envío de email de confirmación', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  it('Debe enviar email de confirmación con los datos correctos', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    const result = await mailService.sendPurchaseConfirmation(data)

    expect(result).toBe(true)
    expect(mockSendMail).toHaveBeenCalledTimes(1)

    // Verificar que se llamó con los parámetros correctos
    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.to).toBe('juan.perez@test.com')
    expect(callArgs.subject).toContain('Confirmación de compra')
    expect(callArgs.subject).toContain('Concierto Rock 2025')
  })

  it('Debe incluir el nombre del usuario en el email', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('Juan Pérez')
  })

  it('Debe incluir los detalles del evento en el email', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('Concierto Rock 2025')
    expect(callArgs.html).toContain('Estadio Central')
    expect(callArgs.html).toContain('Av. Principal 123')
  })

  it('Debe incluir la información de pago en el email', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('5000')
    expect(callArgs.html).toContain('PAY-123456-1')
    expect(callArgs.html).toContain('2') // quantity
  })

  it('Debe enviar email desde la dirección correcta', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.from).toContain('API Entradas Test')
    expect(callArgs.from).toContain('noreply@test.com')
  })
})

// =============================================================================
// TESTS - CÓDIGOS QR EN EL EMAIL
// =============================================================================

describe('MailService - Códigos QR en el email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  it('Debe incluir los códigos QR como adjuntos', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.attachments).toHaveLength(2)
  })

  it('Debe incluir cada QR con el nombre correcto', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    const attachments = callArgs.attachments

    expect(attachments[0].filename).toBe('ticket-101-qr.png')
    expect(attachments[1].filename).toBe('ticket-102-qr.png')
  })

  it('Debe incluir los QR como imágenes base64', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    const attachments = callArgs.attachments

    expect(attachments[0].encoding).toBe('base64')
    expect(attachments[1].encoding).toBe('base64')
  })

  it('Debe asignar CID único a cada QR para usar en el HTML', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    const attachments = callArgs.attachments

    expect(attachments[0].cid).toBe('qr-101')
    expect(attachments[1].cid).toBe('qr-102')

    // Verificar que el HTML incluye referencias a los CID
    expect(callArgs.html).toContain('cid:qr-101')
    expect(callArgs.html).toContain('cid:qr-102')
  })

  it('Debe mostrar el código de cada ticket en el HTML', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Verificar que muestra los IDs de los tickets
    expect(callArgs.html).toContain('Entrada #101')
    expect(callArgs.html).toContain('Entrada #102')
  })

  it('Debe manejar tickets sin QR (qrImageUrl null)', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      tickets: [
        {
          id: 101,
          qrCode: '101-10-5-uuid-aaaa',
          qrImageUrl: null, // Sin imagen
        },
        {
          id: 102,
          qrCode: '102-10-5-uuid-bbbb',
          qrImageUrl: 'data:image/png;base64,QR_DATA',
        },
      ],
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Solo debe incluir el ticket con QR
    expect(callArgs.attachments).toHaveLength(1)
    expect(callArgs.attachments[0].filename).toBe('ticket-102-qr.png')
  })

  it('Debe incluir múltiples QR cuando hay muchos tickets', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      tickets: Array.from({ length: 5 }, (_, i) => ({
        id: 100 + i,
        qrCode: `${100 + i}-10-5-uuid-${i}`,
        qrImageUrl: 'data:image/png;base64,QR_DATA',
      })),
      reservation: { id: 1, quantity: 5 },
      payment: { amount: 12500, externalRef: 'PAY-123456-1' },
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Debe incluir 5 QRs
    expect(callArgs.attachments).toHaveLength(5)
    expect(callArgs.html).toContain('Entrada #100')
    expect(callArgs.html).toContain('Entrada #104')
  })
})

// =============================================================================
// TESTS - FORMATO Y CONTENIDO DEL EMAIL
// =============================================================================

describe('MailService - Formato y contenido del email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  it('Debe generar HTML válido', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    const html = callArgs.html

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html')
    expect(html).toContain('</html>')
  })

  it('Debe incluir título descriptivo en el HTML', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('<title>Confirmación de Compra</title>')
  })

  it('Debe incluir emoji de celebración en el encabezado', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('🎉')
  })

  it('Debe incluir instrucciones importantes para el usuario', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('Importante')
    expect(callArgs.html).toContain('Presenta tu código QR')
    expect(callArgs.html).toContain('un solo uso')
  })

  it('Debe incluir información de contacto de soporte', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('soporte@api-entradas.com')
  })

  it('Debe formatear la fecha del evento correctamente', async () => {
    const mailService = new MailService()
    const eventDate = DateTime.fromISO('2025-12-25T20:00:00')
    
    const data = createPurchaseConfirmationData({
      event: {
        title: 'Evento de Prueba',
        description: 'Descripción',
        datetime: eventDate,
        venue: { name: 'Venue', address: 'Address' },
        price: 1000,
      },
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Verificar formato dd/MM/yyyy
    expect(callArgs.html).toMatch(/25\/12\/2025/)
    
    // Verificar formato HH:mm
    expect(callArgs.html).toMatch(/20:00/)
  })

  it('Debe formatear los precios correctamente con decimales', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      event: {
        title: 'Evento',
        description: 'Desc',
        datetime: DateTime.now(),
        venue: { name: 'V', address: 'A' },
        price: 1234.56,
      },
      payment: {
        amount: 2469.12,
        externalRef: 'PAY-123',
      },
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('1234.56')
    expect(callArgs.html).toContain('2469.12')
  })
})

// =============================================================================
// TESTS - MANEJO DE ERRORES
// =============================================================================

describe('MailService - Manejo de errores', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Debe manejar error de SMTP y retornar false', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'))

    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    const result = await mailService.sendPurchaseConfirmation(data)

    expect(result).toBe(false)
  })

  it('Debe manejar error de autenticación SMTP', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Invalid credentials'))

    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    const result = await mailService.sendPurchaseConfirmation(data)

    expect(result).toBe(false)
  })

  it('Debe manejar timeout de conexión', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Connection timeout'))

    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    const result = await mailService.sendPurchaseConfirmation(data)

    expect(result).toBe(false)
  })

  it('Debe manejar error de email inválido', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('Invalid recipient'))

    const mailService = new MailService()
    const data = createPurchaseConfirmationData()

    const result = await mailService.sendPurchaseConfirmation(data)

    expect(result).toBe(false)
  })
})

// =============================================================================
// TESTS - PRUEBA DE CONEXIÓN
// =============================================================================

describe('MailService - Prueba de conexión', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Debe verificar conexión SMTP exitosamente', async () => {
    mockVerify.mockResolvedValueOnce(true)

    const mailService = new MailService()
    const result = await mailService.testConnection()

    expect(result).toBe(true)
    expect(mockVerify).toHaveBeenCalled()
  })

  it('Debe manejar error de verificación de conexión', async () => {
    mockVerify.mockRejectedValueOnce(new Error('Connection failed'))

    const mailService = new MailService()
    const result = await mailService.testConnection()

    expect(result).toBe(false)
  })
})

// =============================================================================
// TESTS - VALIDACIÓN DE QR VÁLIDO
// =============================================================================

describe('MailService - Validación de QR válido en confirmación', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  it('Debe enviar email solo con QR válidos (no vacíos)', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      tickets: [
        {
          id: 101,
          qrCode: '101-10-5-uuid-aaaa',
          qrImageUrl: 'data:image/png;base64,VALID_QR',
        },
        {
          id: 102,
          qrCode: '', // QR vacío (inválido)
          qrImageUrl: null,
        },
        {
          id: 103,
          qrCode: '103-10-5-uuid-cccc',
          qrImageUrl: 'data:image/png;base64,VALID_QR',
        },
      ],
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    
    // Solo debe incluir los tickets con QR válido
    expect(callArgs.attachments).toHaveLength(2)
  })

  it('Debe validar formato base64 de imagen QR', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      tickets: [
        {
          id: 101,
          qrCode: '101-10-5-uuid-aaaa',
          qrImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ',
        },
      ],
    })

    await mailService.sendPurchaseConfirmation(data)

    const callArgs = mockSendMail.mock.calls[0][0]
    const attachment = callArgs.attachments[0]

    // Verificar que extrajo correctamente la parte base64
    expect(attachment.content).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')
    expect(attachment.encoding).toBe('base64')
  })

  it('Debe enviar email aunque todos los tickets no tengan QR imagen', async () => {
    const mailService = new MailService()
    const data = createPurchaseConfirmationData({
      tickets: [
        {
          id: 101,
          qrCode: '101-10-5-uuid-aaaa',
          qrImageUrl: null,
        },
      ],
    })

    const result = await mailService.sendPurchaseConfirmation(data)

    // El email debe enviarse igual (sin adjuntos)
    expect(result).toBe(true)
    expect(mockSendMail).toHaveBeenCalled()
    
    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.attachments).toHaveLength(0)
  })
})
