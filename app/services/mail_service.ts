import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import env from '#start/env'
import { DateTime } from 'luxon'

interface TicketData {
  id: number
  qrCode: string
  qrImageUrl: string | null
}

interface EventData {
  title: string
  description: string
  datetime: DateTime
  venue: {
    name: string
    address: string
  }
  price: number
}

interface PurchaseConfirmationData {
  user: {
    firstName: string
    lastName: string
    email: string
  }
  event: EventData
  tickets: TicketData[]
  payment: {
    amount: number
    externalRef: string
  }
  reservation: {
    id: number
    quantity: number
  }
}

export default class MailService {
  private transporter: Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  /**
   * Initialize the email transporter with SMTP configuration
   */
  private initializeTransporter() {
    const smtpHost = env.get('SMTP_HOST')
    const smtpPort = env.get('SMTP_PORT')
    const smtpUser = env.get('SMTP_USER')
    const smtpPassword = env.get('SMTP_PASSWORD')

    // Only initialize if SMTP is configured
    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })
    } else {
      console.warn('⚠️  SMTP not configured. Emails will be logged to console instead.')
    }
  }

  /**
   * Send purchase confirmation email with tickets
   */
  async sendPurchaseConfirmation(data: PurchaseConfirmationData): Promise<boolean> {
    const { user, event, tickets, payment } = data

    const subject = `✅ Confirmación de compra - ${event.title}`
    const htmlContent = this.generatePurchaseConfirmationHTML(data)

    // Prepare attachments (QR codes)
    const attachments = tickets
      .filter((ticket) => ticket.qrImageUrl !== null)
      .map((ticket) => ({
        filename: `ticket-${ticket.id}-qr.png`,
        content: ticket.qrImageUrl!.split(',')[1], // Extract base64 data
        encoding: 'base64',
        cid: `qr-${ticket.id}`, // Content ID for inline images
      }))

    const mailOptions = {
      from: `${env.get('MAIL_FROM_NAME', 'API Entradas')} <${env.get('MAIL_FROM_ADDRESS', 'noreply@api-entradas.com')}>`,
      to: user.email,
      subject: subject,
      html: htmlContent,
      attachments: attachments,
    }

    try {
      if (this.transporter) {
        // Send real email
        const info = await this.transporter.sendMail(mailOptions)
        console.log('✅ Email sent successfully:', info.messageId)
        return true
      } else {
        // Development mode - log to console
        console.log('\n📧 ========== EMAIL (Development Mode) ==========')
        console.log('To:', user.email)
        console.log('Subject:', subject)
        console.log('Event:', event.title)
        console.log('Tickets:', tickets.length)
        console.log('Amount:', payment.amount)
        console.log('='.repeat(50) + '\n')
        return true
      }
    } catch (error) {
      console.error('❌ Error sending email:', error)
      return false
    }
  }

  /**
   * Generate HTML template for purchase confirmation email
   */
  private generatePurchaseConfirmationHTML(data: PurchaseConfirmationData): string {
    const { user, event, tickets, payment, reservation } = data

    // Format date
    const eventDate = event.datetime.toFormat('dd/MM/yyyy')
    const eventTime = event.datetime.toFormat('HH:mm')

    // Generate QR images inline
    const qrImages = tickets
      .map(
        (ticket) => `
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #495057;">Entrada #${ticket.id}</p>
        <img src="cid:qr-${ticket.id}" alt="QR Code" style="width: 250px; height: 250px; border: 2px solid #dee2e6; border-radius: 4px;" />
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d;">Código: ${ticket.qrCode.split('-')[0]}</p>
      </div>
    `
      )
      .join('')

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Compra</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Compra Confirmada! 🎉</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Tu entrada ha sido generada exitosamente</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 22px;">Hola ${user.firstName} ${user.lastName},</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0;">
                ¡Gracias por tu compra! Tu pago ha sido procesado exitosamente. A continuación encontrarás los detalles de tu entrada.
              </p>
            </td>
          </tr>

          <!-- Event Details -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 20px;">📅 Detalles del Evento</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold; width: 30%;">Evento:</td>
                    <td style="padding: 8px 0; color: #333333;">${event.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Fecha:</td>
                    <td style="padding: 8px 0; color: #333333;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Hora:</td>
                    <td style="padding: 8px 0; color: #333333;">${eventTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Lugar:</td>
                    <td style="padding: 8px 0; color: #333333;">${event.venue.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Dirección:</td>
                    <td style="padding: 8px 0; color: #333333;">${event.venue.address}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Payment Summary -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #e7f5ff; border-left: 4px solid #1971c2; padding: 20px; border-radius: 4px;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">💳 Resumen de Pago</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Cantidad de entradas:</td>
                    <td style="padding: 8px 0; color: #333333; text-align: right;">${reservation.quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-weight: bold;">Precio por entrada:</td>
                    <td style="padding: 8px 0; color: #333333; text-align: right;">$${event.price.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #1971c2;">
                    <td style="padding: 12px 0 8px 0; color: #333333; font-weight: bold; font-size: 18px;">Total pagado:</td>
                    <td style="padding: 12px 0 8px 0; color: #1971c2; font-weight: bold; font-size: 18px; text-align: right;">$${payment.amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 12px;">Referencia:</td>
                    <td style="padding: 4px 0; color: #666666; font-size: 12px; text-align: right;">${payment.externalRef}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- QR Codes -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🎫 Tus Entradas</h3>
              <p style="color: #666666; text-align: center; margin: 0 0 20px 0; line-height: 1.6;">
                Presenta estos códigos QR en la entrada del evento. Puedes guardarlos en tu dispositivo o mostrarlos directamente desde tu correo.
              </p>
              
              ${qrImages}
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">⚠️ Importante</h3>
                <ul style="color: #666666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Llega con anticipación al evento</li>
                  <li>Presenta tu código QR en la entrada</li>
                  <li>Cada código QR es de un solo uso</li>
                  <li>Guarda este correo para futuras referencias</li>
                  <li>En caso de problemas, contacta a soporte</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                ¿Tienes preguntas? Contáctanos en 
                <a href="mailto:soporte@api-entradas.com" style="color: #667eea; text-decoration: none;">soporte@api-entradas.com</a>
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} API Entradas. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.log('ℹ️  SMTP not configured. Skipping connection test.')
      return false
    }

    try {
      await this.transporter.verify()
      console.log('✅ SMTP connection successful!')
      return true
    } catch (error) {
      console.error('❌ SMTP connection failed:', error)
      return false
    }
  }
}
