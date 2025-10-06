import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import ReservationStatus from '#models/reservation_status'
import PaymentStatus from '#models/payment_status'
import TicketStatus from '#models/ticket_status'
import Payment from '#models/payment'
import Ticket from '#models/ticket'
import QrService from '#services/qr_service'
import MailService from '#services/mail_service'
import db from '@adonisjs/lucid/services/db'

export default class PaymentsController {
  /**
   * POST /tickets/pay
   * Process payment for a reservation and generate tickets
   */
  async pay({ request, response }: HttpContext) {
    const { reservation_id: reservationId } = request.only(['reservation_id'])

    if (!reservationId) {
      return response.badRequest({
        error: 'Validation failed',
        message: 'El campo reservation_id es requerido',
      })
    }

    // Use transaction to ensure data consistency
    const trx = await db.transaction()

    try {
      // 1. Find the reservation with relations
      const reservation = await Reservation.query({ client: trx })
        .where('id', reservationId)
        .preload('status')
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('user')
        .firstOrFail()

      // 2. Validate reservation status - should be PENDING
      const pendingStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'PENDING')
        .firstOrFail()

      if (reservation.statusId !== pendingStatus.id) {
        await trx.rollback()
        return response.badRequest({
          error: 'Invalid reservation status',
          message: 'La reserva no está en estado pendiente',
        })
      }

      // 3. Check if reservation hasn't expired
      if (reservation.expiresAt < DateTime.now()) {
        // Mark as expired
        const expiredStatus = await ReservationStatus.query({ client: trx })
          .where('code', 'EXPIRED')
          .firstOrFail()

        reservation.statusId = expiredStatus.id
        await reservation.save()
        await trx.rollback()

        return response.badRequest({
          error: 'Reservation expired',
          message: 'La reserva ha expirado',
        })
      }

      // 4. Mark reservation as PAID
      const paidStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'PAID')
        .firstOrFail()

      reservation.statusId = paidStatus.id
      await reservation.save()

      // 5. Create payment record with APPROVED status
      const approvedPaymentStatus = await PaymentStatus.query({ client: trx })
        .where('code', 'APPROVED')
        .firstOrFail()

      const payment = await Payment.create(
        {
          reservationId: reservation.id,
          statusId: approvedPaymentStatus.id,
          amount: reservation.totalAmount,
          provider: 'SIMULATED_GATEWAY',
          externalRef: `PAY-${Date.now()}-${reservation.id}`,
        },
        { client: trx }
      )

      // 6. Generate tickets with QR codes
      const qrService = new QrService()
      const activeTicketStatus = await TicketStatus.query({ client: trx })
        .where('code', 'ACTIVE')
        .firstOrFail()

      const tickets = []
      for (let i = 0; i < reservation.quantity; i++) {
        // Create ticket first to get the ID
        const ticket = await Ticket.create(
          {
            eventId: reservation.eventId,
            reservationId: reservation.id,
            ownerId: reservation.userId,
            statusId: activeTicketStatus.id,
            qrCode: 'TEMP', // Temporary value
          },
          { client: trx }
        )

        // Generate QR code with the ticket ID
        const { qrCode, qrImageUrl } = await qrService.generateTicketQR(
          ticket.id,
          reservation.eventId,
          reservation.userId
        )

        // Update ticket with QR code
        ticket.qrCode = qrCode
        ticket.qrImageUrl = qrImageUrl
        await ticket.save()

        tickets.push(ticket)
      }

      // Commit transaction
      await trx.commit()

      // 7. Send purchase confirmation email
      try {
        const mailService = new MailService()
        await mailService.sendPurchaseConfirmation({
          user: {
            firstName: reservation.user.firstName,
            lastName: reservation.user.lastName,
            email: reservation.user.email,
          },
          event: {
            title: reservation.event.title,
            description: reservation.event.description,
            datetime: reservation.event.datetime,
            venue: {
              name: reservation.event.venue.name,
              address: reservation.event.venue.address,
            },
            price: reservation.event.price,
          },
          tickets: tickets.map((ticket) => ({
            id: ticket.id,
            qrCode: ticket.qrCode,
            qrImageUrl: ticket.qrImageUrl,
          })),
          payment: {
            amount: payment.amount,
            externalRef: payment.externalRef,
          },
          reservation: {
            id: reservation.id,
            quantity: reservation.quantity,
          },
        })
        console.log('✅ Confirmation email sent successfully')
      } catch (emailError) {
        // Log email error but don't fail the payment
        console.error('⚠️  Error sending confirmation email:', emailError)
      }

      // 8. Return success response
      return response.ok({
        message: 'Pago procesado exitosamente',
        data: {
          reservation: {
            id: reservation.id,
            status: 'PAID',
            quantity: reservation.quantity,
            totalAmount: reservation.totalAmount,
          },
          payment: {
            id: payment.id,
            status: 'APPROVED',
            amount: payment.amount,
            provider: payment.provider,
            externalRef: payment.externalRef,
          },
          tickets: tickets.map((ticket) => ({
            id: ticket.id,
            qrCode: ticket.qrCode,
            qrImageUrl: ticket.qrImageUrl,
            status: 'ACTIVE',
          })),
        },
      })
    } catch (error) {
      // Rollback transaction on error
      await trx.rollback()

      // Handle not found errors
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Reserva no encontrada',
        })
      }

      // Log error for debugging
      console.error('Error processing payment:', error)

      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al procesar el pago',
      })
    }
  }
}
