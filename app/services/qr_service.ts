import QRCode from 'qrcode'
import { randomUUID } from 'node:crypto'

export default class QrService {
  /**
   * Generate a unique QR code for a ticket
   * @param ticketId - The ID of the ticket
   * @param eventId - The ID of the event
   * @param userId - The ID of the ticket owner
   * @returns Object containing the QR code string and data URL
   */
  async generateTicketQR(
    ticketId: number,
    eventId: number,
    userId: number
  ): Promise<{ qrCode: string; qrImageUrl: string }> {
    // Generate a unique code for the ticket
    const uniqueCode = `${ticketId}-${eventId}-${userId}-${randomUUID()}`

    // Generate QR code as data URL (base64 encoded image)
    const qrImageUrl = await QRCode.toDataURL(uniqueCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    })

    return {
      qrCode: uniqueCode,
      qrImageUrl: qrImageUrl,
    }
  }

  /**
   * Verify if a QR code is valid
   * @param qrCode - The QR code to verify
   * @returns boolean indicating if the code format is valid
   */
  verifyQRCode(qrCode: string): boolean {
    // Basic validation - checks if the code matches expected format
    const parts = qrCode.split('-')
    return parts.length === 4 && !parts.some((part) => !part)
  }
}
