import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { Resend } from 'resend'
import env from '#start/env'
import { DateTime } from 'luxon'
import PdfService from '#services/pdf_service'

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
  private resend: Resend | null = null
  private emailProvider: 'resend' | 'smtp' | 'console' = 'console'

  constructor() {
    this.initializeEmailProvider()
  }

  /**
   * Initialize the email provider (Resend, SMTP, or console logging)
   * Priority: 1. Resend (production), 2. SMTP (development), 3. Console (fallback)
   */
  private initializeEmailProvider() {
    const resendApiKey = env.get('RESEND_API_KEY')
    const smtpHost = env.get('SMTP_HOST')
    const smtpPort = env.get('SMTP_PORT')
    const smtpUser = env.get('SMTP_USER')
    const smtpPassword = env.get('SMTP_PASSWORD')

    // Priority 1: Resend (recommended for production)
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey)
      this.emailProvider = 'resend'
      console.log('✅ Email provider: Resend (production mode)')
      return
    }

    // Priority 2: SMTP (for development/testing)
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
      this.emailProvider = 'smtp'
      console.log('✅ Email provider: SMTP')
      return
    }

    // Priority 3: Console logging (fallback)
    console.warn('⚠️  No email provider configured. Emails will be logged to console instead.')
    console.warn('💡 For production, set RESEND_API_KEY in environment variables')
    this.emailProvider = 'console'
  }

  /**
   * Send purchase confirmation email with tickets
   */
  async sendPurchaseConfirmation(data: PurchaseConfirmationData): Promise<boolean> {
    const { user, event, tickets, payment } = data

    const subject = `✅ Confirmación de compra - ${event.title}`
    const htmlContent = this.generatePurchaseConfirmationHTML(data)
    const fromEmail = env.get('MAIL_FROM_ADDRESS', 'noreply@api-entradas.com')
    const fromName = env.get('MAIL_FROM_NAME', 'API Entradas')

    try {
      if (this.emailProvider === 'resend') {
        // Send with Resend (production)
        console.log('📧 Intentando enviar email via Resend...')
        console.log('   De:', `${fromName} <${fromEmail}>`)
        console.log('   Para:', user.email)
        console.log('   Asunto:', subject)

        let pdfBuffer: Buffer | null = null

        // Generate PDF with tickets
        try {
          console.log('📄 Generando PDF con entradas...')
          const pdfService = new PdfService()
          pdfBuffer = await pdfService.generateTicketsPDF(
            tickets.map((t) => ({
              id: t.id,
              qrCode: t.qrCode,
              qrImageUrl: t.qrImageUrl || '',
            })),
            {
              title: event.title,
              datetime: event.datetime,
              venue: event.venue,
            },
            {
              firstName: user.firstName,
              lastName: user.lastName,
            }
          )
          console.log('✅ PDF generado correctamente, tamaño:', pdfBuffer.length, 'bytes')
        } catch (pdfError) {
          console.error('⚠️  Error generando PDF:', pdfError)
          console.error('   Stack:', pdfError.stack)
          console.error('   Se enviará el email sin PDF adjunto')
        }

        const emailData: any = {
          from: `${fromName} <${fromEmail}>`,
          to: user.email,
          subject: subject,
          html: htmlContent,
        }

        // Add PDF attachment if generated successfully
        if (pdfBuffer) {
          emailData.attachments = [
            {
              filename: `entradas-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
              content: pdfBuffer,
            },
          ]
          console.log('📎 PDF adjuntado al email')
        }

        const result = await this.resend!.emails.send(emailData)

        if (result.error) {
          console.error('❌ Resend error:', result.error)
          console.error('   Error completo:', JSON.stringify(result.error, null, 2))

          // If error is due to unverified email, log helpful message
          if (
            result.error.message?.includes('verify') ||
            result.error.message?.includes('domain')
          ) {
            console.warn('⚠️  LIMITACIÓN DE RESEND:')
            console.warn('   En modo gratuito, Resend solo envía a emails verificados.')
            console.warn('   Opciones:')
            console.warn('   1. Verifica el email del destinatario en Resend dashboard')
            console.warn('   2. Verifica tu dominio en Resend para enviar a cualquier email')
            console.warn('   3. Usa SMTP (Gmail/Mailtrap) en desarrollo')
          }

          return false
        }

        console.log('✅ Email sent via Resend:', result.data?.id)
        console.log('   Destinatario:', user.email)
        console.log('   PDF adjunto:', pdfBuffer ? '✅' : '❌')
        return true
      } else if (this.emailProvider === 'smtp') {
        // Send with SMTP (development/testing)
        const attachments = tickets
          .filter((ticket) => ticket.qrImageUrl !== null && ticket.qrImageUrl !== undefined)
          .map((ticket) => ({
            filename: `ticket-${ticket.id}-qr.png`,
            content: ticket.qrImageUrl!.split(',')[1],
            encoding: 'base64' as const,
            cid: `qr-${ticket.id}`,
          }))

        const info = await this.transporter!.sendMail({
          from: `${fromName} <${fromEmail}>`,
          to: user.email,
          subject: subject,
          html: htmlContent,
          attachments: attachments,
        })

        console.log('✅ Email sent via SMTP:', info.messageId)
        return true
      } else {
        // Console mode (development fallback)
        console.log('\n' + '='.repeat(80))
        console.log('📧 EMAIL ENVIADO (Modo Desarrollo - Solo Console)')
        console.log('='.repeat(80))
        console.log('De:       ', `${fromName} <${fromEmail}>`)
        console.log('Para:     ', user.email)
        console.log('Asunto:   ', subject)
        console.log('-'.repeat(80))
        console.log('EVENTO:')
        console.log('  Título:    ', event.title)
        console.log('  Fecha:     ', event.datetime.toFormat('dd/MM/yyyy HH:mm'))
        console.log('  Lugar:     ', event.venue.name)
        console.log('  Dirección: ', event.venue.address)
        console.log('-'.repeat(80))
        console.log('PAGO:')
        console.log('  Cantidad:  ', payment.amount, 'ARS')
        console.log('  Ref:       ', payment.externalRef)
        console.log('-'.repeat(80))
        console.log('ENTRADAS (' + tickets.length + '):')
        tickets.forEach((ticket, index) => {
          console.log(`  Entrada ${index + 1}:`)
          console.log(`    ID:      ${ticket.id}`)
          console.log(`    QR:      ${ticket.qrCode}`)
          if (ticket.qrImageUrl) {
            console.log(`    QR IMG:  ${ticket.qrImageUrl.substring(0, 50)}...`)
          }
        })
        console.log('='.repeat(80))
        console.log('✅ Email procesado exitosamente (mostrado en consola)')
        console.log('💡 Para enviar emails reales, configura RESEND_API_KEY o SMTP')
        console.log('='.repeat(80) + '\n')
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

    // Generate ticket cards (simplified for email - full QR in PDF)
    const qrImages = tickets
      .map(
        (ticket) => `
      <div style="text-align: center; margin: 15px 0; padding: 15px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #667eea; font-weight: bold;">Entrada #${ticket.id}</p>
        <p style="margin: 5px 0 0 0; font-family: 'Courier New', monospace; font-size: 11px; color: #999; word-break: break-all;">${ticket.qrCode}</p>
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
                    <td style="padding: 8px 0; color: #333333; text-align: right;">$${Number(event.price).toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #1971c2;">
                    <td style="padding: 12px 0 8px 0; color: #333333; font-weight: bold; font-size: 18px;">Total pagado:</td>
                    <td style="padding: 12px 0 8px 0; color: #1971c2; font-weight: bold; font-size: 18px; text-align: right;">$${Number(payment.amount).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666666; font-size: 12px;">Referencia:</td>
                    <td style="padding: 4px 0; color: #666666; font-size: 12px; text-align: right;">${payment.externalRef}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Tickets Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🎫 Tus Entradas</h3>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center;">
                <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
                  📎 Entradas adjuntas en PDF
                </p>
                <p style="color: #ffffff; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                  Descarga el archivo PDF adjunto a este email para ver tus entradas con los códigos QR.
                  <br>Puedes guardarlo en tu móvil o imprimirlo.
                </p>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #ffffff; margin: 0; font-size: 13px;">
                    📥 <strong>Busca el archivo adjunto</strong> al final de este email
                  </p>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-align: center;">
                  <strong>Tus entradas:</strong>
                </p>
                ${qrImages}
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">⚠️ Importante</h3>
                <ul style="color: #666666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Descarga el PDF adjunto</strong> - Contiene tus entradas con códigos QR</li>
                  <li>Guarda el PDF en tu móvil o imprímelo</li>
                  <li>Presenta el código QR en la entrada del evento</li>
                  <li>Llega con anticipación al evento</li>
                  <li>Cada código QR es de un solo uso</li>
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
    if (this.emailProvider === 'resend') {
      console.log('ℹ️  Using Resend - no connection test needed')
      return true
    }

    if (this.emailProvider === 'smtp' && this.transporter) {
      try {
        await this.transporter.verify()
        console.log('✅ SMTP connection successful!')
        return true
      } catch (error) {
        console.error('❌ SMTP connection failed:', error)
        return false
      }
    }

    console.log('ℹ️  Email provider:', this.emailProvider)
    return this.emailProvider === 'console'
  }
}
