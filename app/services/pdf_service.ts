import PDFDocument from 'pdfkit'
import { DateTime } from 'luxon'

interface TicketPDFData {
  id: number
  qrCode: string
  qrImageUrl: string
}

interface EventPDFData {
  title: string
  datetime: DateTime
  venue: {
    name: string
    address: string
  }
}

interface UserPDFData {
  firstName: string
  lastName: string
}

export default class PdfService {
  /**
   * Generate a PDF with tickets and QR codes
   */
  async generateTicketsPDF(
    tickets: TicketPDFData[],
    event: EventPDFData,
    user: UserPDFData
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        })

        const chunks: Buffer[] = []
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        // Header
        doc
          .fontSize(24)
          .fillColor('#667eea')
          .text('🎫 Tus Entradas', { align: 'center' })
          .moveDown(0.5)

        // Event info
        doc
          .fontSize(18)
          .fillColor('#333333')
          .text(event.title, { align: 'center' })
          .moveDown(0.3)

        doc
          .fontSize(12)
          .fillColor('#666666')
          .text(`${event.datetime.toFormat('dd/MM/yyyy')} - ${event.datetime.toFormat('HH:mm')}`, {
            align: 'center',
          })
          .text(`${event.venue.name}`, { align: 'center' })
          .text(`${event.venue.address}`, { align: 'center' })
          .moveDown(1)

        // User info
        doc
          .fontSize(10)
          .fillColor('#999999')
          .text(`Titular: ${user.firstName} ${user.lastName}`, { align: 'center' })
          .moveDown(1.5)

        // Generate a ticket card for each ticket
        tickets.forEach((ticket, index) => {
          if (index > 0) {
            doc.addPage()
          }

          const pageWidth = doc.page.width
          const pageHeight = doc.page.height
          const margin = 50
          const cardWidth = pageWidth - margin * 2
          const cardHeight = 500

          // Center the card vertically
          const startY = (pageHeight - cardHeight) / 2

          // Draw card background
          doc
            .rect(margin, startY, cardWidth, cardHeight)
            .fillAndStroke('#f8f9fa', '#667eea')
            .lineWidth(2)

          // Ticket number
          doc
            .fontSize(16)
            .fillColor('#667eea')
            .text(`Entrada #${ticket.id}`, margin + 20, startY + 20, {
              width: cardWidth - 40,
              align: 'center',
            })

          // QR Code image
          if (ticket.qrImageUrl) {
            const qrSize = 250
            const qrX = (pageWidth - qrSize) / 2
            const qrY = startY + 60

            try {
              // Remove data URI prefix
              const base64Data = ticket.qrImageUrl.split(',')[1]
              const imageBuffer = Buffer.from(base64Data, 'base64')

              doc.image(imageBuffer, qrX, qrY, {
                width: qrSize,
                height: qrSize,
                align: 'center',
              })
            } catch (error) {
              console.error('Error adding QR image to PDF:', error)
              // If image fails, show text instead
              doc
                .fontSize(12)
                .fillColor('#666666')
                .text('(Código QR no disponible)', qrX, qrY + 100, {
                  width: qrSize,
                  align: 'center',
                })
            }
          }

          // QR Code text
          doc
            .fontSize(10)
            .fillColor('#666666')
            .text('Código:', margin + 20, startY + 330, { width: cardWidth - 40, align: 'center' })

          doc
            .fontSize(9)
            .font('Courier')
            .fillColor('#333333')
            .text(ticket.qrCode, margin + 20, startY + 350, {
              width: cardWidth - 40,
              align: 'center',
            })

          // Instructions
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#999999')
            .text('Presenta este código QR en la entrada del evento', margin + 20, startY + 400, {
              width: cardWidth - 40,
              align: 'center',
            })
            .text('Válido para un solo uso', { width: cardWidth - 40, align: 'center' })
        })

        // Footer on last page
        doc
          .fontSize(8)
          .fillColor('#cccccc')
          .text(
            `Generado el ${DateTime.now().toFormat('dd/MM/yyyy HH:mm')} | API Entradas`,
            50,
            doc.page.height - 30,
            {
              width: doc.page.width - 100,
              align: 'center',
            }
          )

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}
