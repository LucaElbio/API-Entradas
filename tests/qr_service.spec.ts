/**
 * Tests para QrService
 *
 * Cobertura:
 * - Generar código QR único para cada entrada
 * - Verificar que cada entrada tiene un QR distinto (gracias al UUID)
 * - Validar que el QR corresponde al usuario correcto
 * - Verificar que los QR no se repiten
 * 
 * Nota: El formato del QR es: eventId|userId|uuid
 * El backend ya no incluye ticketId en el QR para mantenerlo estable
 */

// Mock de qrcode usando el mock manual
jest.mock('qrcode')

import QrService from '../app/services/qr_service'

// =============================================================================
// TESTS - GENERACIÓN DE QR ÚNICO
// =============================================================================

describe('QrService - Generación de código QR único', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe generar un QR único con formato correcto', async () => {
    // Arrange
    const eventId = 10
    const userId = 5

    // Act
    const result = await qrService.generateTicketQR(eventId, userId)

    // Assert
    expect(result).toHaveProperty('qrCode')
    expect(result).toHaveProperty('qrImageUrl')

    // Verificar formato del qrCode: eventId|userId|uuid
    // Formato real: 10|5|xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const parts = result.qrCode.split('|')
    expect(parts.length).toBe(3) // eventId, userId, uuid
    expect(parts[0]).toBe('10') // eventId
    expect(parts[1]).toBe('5') // userId

    // Verificar que la tercera parte es un UUID válido
    const uuidPart = parts[2]
    expect(uuidPart).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)

    // Verificar que qrImageUrl es una imagen base64
    expect(result.qrImageUrl).toMatch(/^data:image\/png;base64,/)
  })

  it('Debe incluir el eventId en el código QR generado', async () => {
    const eventId = 999
    const userId = 25

    const result = await qrService.generateTicketQR(eventId, userId)

    expect(result.qrCode).toContain('999')
  })

  it('Debe incluir el userId en el código QR generado (usuario correcto)', async () => {
    const eventId = 20
    const userId = 777

    const result = await qrService.generateTicketQR(eventId, userId)

    expect(result.qrCode).toContain('777')
  })

  it('Debe generar QR con UUID único', async () => {
    const eventId = 20
    const userId = 888

    const result = await qrService.generateTicketQR(eventId, userId)

    // Verificar que contiene el userId
    expect(result.qrCode).toContain('888')
    
    // Verificar que contiene un UUID válido (tercera parte)
    const parts = result.qrCode.split('|')
    expect(parts[2]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i)
  })

  it('Debe generar una imagen QR válida en formato base64', async () => {
    const result = await qrService.generateTicketQR(1, 1)

    // Verificar que es una cadena base64 válida
    const base64Data = result.qrImageUrl.replace(/^data:image\/png;base64,/, '')
    expect(() => Buffer.from(base64Data, 'base64')).not.toThrow()

    // NOTA: Con el mock, la imagen es pequeña. En producción sería mucho más grande.
    // Verificar que tiene contenido (al menos 20 caracteres con el mock)
    expect(base64Data.length).toBeGreaterThan(20)
  })
})

// =============================================================================
// TESTS - CADA ENTRADA TIENE QR DISTINTO
// =============================================================================

describe('QrService - Cada entrada tiene QR distinto', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe generar QRs diferentes con UUIDs únicos', async () => {
    const eventId = 10
    const userId = 5

    const qr1 = await qrService.generateTicketQR(eventId, userId)
    const qr2 = await qrService.generateTicketQR(eventId, userId)

    // Los códigos QR deben ser completamente diferentes (por el UUID)
    expect(qr1.qrCode).not.toBe(qr2.qrCode)
    expect(qr1.qrImageUrl).not.toBe(qr2.qrImageUrl)
  })

  it('Debe generar QRs diferentes para diferentes eventIds', async () => {
    const userId = 5

    const qr1 = await qrService.generateTicketQR(10, userId)
    const qr2 = await qrService.generateTicketQR(20, userId)

    expect(qr1.qrCode).not.toBe(qr2.qrCode)
    expect(qr1.qrImageUrl).not.toBe(qr2.qrImageUrl)
  })

  it('Debe generar QRs diferentes para diferentes userIds', async () => {
    const eventId = 10

    const qr1 = await qrService.generateTicketQR(eventId, 5)
    const qr2 = await qrService.generateTicketQR(eventId, 10)

    expect(qr1.qrCode).not.toBe(qr2.qrCode)
    expect(qr1.qrImageUrl).not.toBe(qr2.qrImageUrl)
  })

  it('Debe generar QRs únicos incluso con los mismos parámetros (por UUID)', async () => {
    // Importante: Aunque tengamos los mismos parámetros, el UUID hace que sea único
    const eventId = 10
    const userId = 5

    const qr1 = await qrService.generateTicketQR(eventId, userId)
    const qr2 = await qrService.generateTicketQR(eventId, userId)

    // Aunque los parámetros sean iguales, el UUID los hace diferentes
    expect(qr1.qrCode).not.toBe(qr2.qrCode)
    expect(qr1.qrImageUrl).not.toBe(qr2.qrImageUrl)

    // Pero deben tener los mismos primeros 2 componentes (eventId y userId)
    const parts1 = qr1.qrCode.split('|')
    const parts2 = qr2.qrCode.split('|')
    expect(parts1[0]).toBe(parts2[0]) // eventId
    expect(parts1[1]).toBe(parts2[1]) // userId

    // Solo el UUID debe ser diferente
    const uuid1 = parts1[2]
    const uuid2 = parts2[2]
    expect(uuid1).not.toBe(uuid2)
  })

  it('Debe generar N QRs únicos en un lote (simulación de compra múltiple)', async () => {
    const eventId = 10
    const userId = 5
    const numberOfTickets = 10

    // Generar múltiples QR como si fuera una compra de 10 tickets
    const qrCodes = await Promise.all(
      Array.from({ length: numberOfTickets }, () =>
        qrService.generateTicketQR(eventId, userId)
      )
    )

    // Extraer solo los códigos QR
    const codes = qrCodes.map((qr) => qr.qrCode)

    // Verificar que todos son únicos (gracias al UUID)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(numberOfTickets)

    // Verificar que todas las imágenes también son únicas
    const images = qrCodes.map((qr) => qr.qrImageUrl)
    const uniqueImages = new Set(images)
    expect(uniqueImages.size).toBe(numberOfTickets)
  })
})

// =============================================================================
// TESTS - QR CORRESPONDE AL USUARIO CORRECTO
// =============================================================================

describe('QrService - QR corresponde al usuario correcto', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe incluir el userId correcto en el código QR', async () => {
    const eventId = 10
    const userId = 555

    const result = await qrService.generateTicketQR(eventId, userId)

    // Extraer el userId del código QR (segunda parte)
    const parts = result.qrCode.split('|')
    const extractedUserId = Number.parseInt(parts[1], 10)

    expect(extractedUserId).toBe(userId)
  })

  it('Debe diferenciar QRs de diferentes usuarios para el mismo evento', async () => {
    const eventId = 10
    const user1Id = 10
    const user2Id = 20

    const qr1 = await qrService.generateTicketQR(eventId, user1Id)
    const qr2 = await qrService.generateTicketQR(eventId, user2Id)

    // Los QR deben ser diferentes
    expect(qr1.qrCode).not.toBe(qr2.qrCode)

    // Verificar que cada uno tiene el userId correcto
    const parts1 = qr1.qrCode.split('|')
    const parts2 = qr2.qrCode.split('|')

    expect(parts1[1]).toBe('10') // user1Id
    expect(parts2[1]).toBe('20') // user2Id
  })

  it('Debe mantener la integridad del userId en múltiples generaciones', async () => {
    const userId = 12345

    // Generar múltiples QR para el mismo usuario
    const qrCodes = await Promise.all([
      qrService.generateTicketQR(10, userId),
      qrService.generateTicketQR(10, userId),
      qrService.generateTicketQR(10, userId),
      qrService.generateTicketQR(20, userId),
      qrService.generateTicketQR(30, userId),
    ])

    // Verificar que todos tienen el mismo userId
    qrCodes.forEach((qr) => {
      const parts = qr.qrCode.split('|')
      expect(parts[1]).toBe('12345')
    })
  })

  it('Debe permitir validar el propietario del ticket desde el QR', async () => {
    const eventId = 50
    const expectedUserId = 999

    const result = await qrService.generateTicketQR(eventId, expectedUserId)

    // Simular extracción de userId desde el QR (como haría el backend)
    const extractUserId = (qrCode: string): number => {
      const parts = qrCode.split('|')
      return Number.parseInt(parts[1], 10)
    }

    const extractedUserId = extractUserId(result.qrCode)
    expect(extractedUserId).toBe(expectedUserId)
  })
})

// =============================================================================
// TESTS - VERIFICACIÓN DE QR
// =============================================================================

describe('QrService - Verificación de QR', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe validar un código QR con formato correcto', () => {
    const validQrCode = '123|456|550e8400-e29b-41d4-a716-446655440000'

    const isValid = qrService.verifyQRCode(validQrCode)

    // Este código QR tiene el formato correcto: eventId|userId|uuid
    expect(isValid).toBe(true)
  })

  it('Debe rechazar un código QR con formato incorrecto (menos partes)', () => {
    const invalidQrCode = '123|456' // Solo 2 partes, falta el UUID

    const isValid = qrService.verifyQRCode(invalidQrCode)

    expect(isValid).toBe(false)
  })

  it('Debe rechazar un código QR con partes vacías', () => {
    const invalidQrCode = '123||uuid' // Parte vacía

    const isValid = qrService.verifyQRCode(invalidQrCode)

    expect(isValid).toBe(false)
  })

  it('Debe rechazar un código QR completamente vacío', () => {
    const invalidQrCode = ''

    const isValid = qrService.verifyQRCode(invalidQrCode)

    expect(isValid).toBe(false)
  })

  it('Debe validar QR generados por el propio servicio', async () => {
    const result = await qrService.generateTicketQR(10, 5)

    const isValid = qrService.verifyQRCode(result.qrCode)

    // Los QR generados por el servicio deben ser válidos
    expect(isValid).toBe(true)
  })
})

// =============================================================================
// TESTS - NO REPETICIÓN DE QR
// =============================================================================

describe('QrService - Los QR no se repiten', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe generar 100 QRs únicos sin repeticiones', async () => {
    const numberOfQRs = 100
    const eventId = 1
    const userId = 1

    // Generar 100 QRs
    const qrCodes = await Promise.all(
      Array.from({ length: numberOfQRs }, () => qrService.generateTicketQR(eventId, userId))
    )

    // Extraer solo los códigos
    const codes = qrCodes.map((qr) => qr.qrCode)

    // Verificar que no hay duplicados (gracias al UUID)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(numberOfQRs)
  })

  it('Debe generar QRs únicos incluso con alta concurrencia simulada', async () => {
    const numberOfQRs = 50

    // Simular generación concurrente (múltiples usuarios comprando al mismo tiempo)
    const promises = []
    for (let userId = 1; userId <= 5; userId++) {
      for (let ticket = 1; ticket <= 10; ticket++) {
        promises.push(qrService.generateTicketQR(1, userId))
      }
    }

    const qrCodes = await Promise.all(promises)
    const codes = qrCodes.map((qr) => qr.qrCode)

    // Verificar que todos son únicos (50 tickets únicos gracias al UUID)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(numberOfQRs)
  })

  it('Debe garantizar unicidad a través de UUID aleatorio', async () => {
    // Generar múltiples QR con exactamente los mismos parámetros
    const qrCodes = await Promise.all([
      qrService.generateTicketQR(1, 1),
      qrService.generateTicketQR(1, 1),
      qrService.generateTicketQR(1, 1),
      qrService.generateTicketQR(1, 1),
      qrService.generateTicketQR(1, 1),
    ])

    // Extraer los UUIDs (tercera parte después del eventId y userId)
    const uuids = qrCodes.map((qr) => {
      const parts = qr.qrCode.split('|')
      return parts[2]
    })

    // Todos los UUIDs deben ser únicos
    const uniqueUUIDs = new Set(uuids)
    expect(uniqueUUIDs.size).toBe(5)
  })
})

// =============================================================================
// TESTS - CASOS EDGE
// =============================================================================

describe('QrService - Casos edge', () => {
  let qrService: QrService

  beforeEach(() => {
    qrService = new QrService()
  })

  it('Debe manejar IDs muy grandes', async () => {
    const largeEventId = 888888888
    const largeUserId = 777777777

    const result = await qrService.generateTicketQR(largeEventId, largeUserId)

    expect(result.qrCode).toContain('888888888')
    expect(result.qrCode).toContain('777777777')
  })

  it('Debe manejar IDs de un solo dígito', async () => {
    const result = await qrService.generateTicketQR(2, 3)

    const parts = result.qrCode.split('|')
    expect(parts[0]).toBe('2')
    expect(parts[1]).toBe('3')
  })

  it('Debe generar imagen QR con el tamaño correcto (300x300 por configuración)', async () => {
    const result = await qrService.generateTicketQR(1, 1)

    // NOTA: Este test está limitado por el mock. En producción con librería real,
    // un QR de 300x300 debería tener al menos 5KB-10KB
    // Con el mock solo verificamos que genera alguna imagen
    const base64Data = result.qrImageUrl.replace(/^data:image\/png;base64,/, '')

    // Verificar que genera algún contenido
    expect(base64Data.length).toBeGreaterThan(0)

    // TODO: Para test de integración real, verificar tamaño > 5000 bytes
  })
})
