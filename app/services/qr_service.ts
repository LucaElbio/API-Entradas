import QRCode from 'qrcode'
import { randomUUID } from 'node:crypto'

export default class QrService {
  /**
   * Generate a unique QR code for a ticket.
   * New format: "{eventId}|{userId}|{uuid}" (uses `|` as delimiter to avoid
   * conflicts with UUID dashes).
   *
   * NOTE: We intentionally remove `ticketId` from the QR payload to keep the
   * QR stable and to avoid coupling the QR value to a DB id. You can still
   * store the generated `qrCode` on the ticket record after creating the
   * ticket in the DB.
   *
   * @param eventId - The ID of the event
   * @param userId - The ID of the ticket owner
   * @returns Object containing the QR code string and data URL
   */
  async generateTicketQR(
    eventId: number,
    userId: number
  ): Promise<{ qrCode: string; qrImageUrl: string }> {
    // Use a delimiter ('|') that never appears in UUIDs to keep parsing simple
    const uniqueCode = `${eventId}|${userId}|${randomUUID()}`

    const qrImageUrl = await QRCode.toDataURL(uniqueCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    })

    return {
      qrCode: uniqueCode,
      qrImageUrl,
    }
  }

  /**
   * Verify if a QR code is valid according to the new format
   * Expected parts: [ eventId, userId, uuid ]
   */
  verifyQRCode(qrCode: string): boolean {
    if (!qrCode || typeof qrCode !== 'string') return false

    const parts = qrCode.split('|')
    if (parts.length !== 3) return false

    const [eventPart, userPart, uuidPart] = parts
    if (!eventPart || !userPart || !uuidPart) return false

    // Basic numeric checks for eventId and userId
    if (!/^[0-9]+$/.test(eventPart)) return false
    if (!/^[0-9]+$/.test(userPart)) return false

    // UUID v4 basic validation (hex and dashes)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidV4Regex.test(uuidPart)
  }
}
