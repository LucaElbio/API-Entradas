import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Ticket from '#models/ticket'
import QrService from '#services/qr_service'

export default class TicketsController {
  /**
   * GET /tickets
   * Get all tickets for the authenticated user
   */
  async index({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

      const tickets = await Ticket.query()
        .where('owner_id', user.id)
        .preload('event')
        .preload('status')
        .preload('reservation')
        .orderBy('created_at', 'desc')

      return response.ok({
        message: 'Tickets obtenidos exitosamente',
        data: tickets.map((ticket) => ({
          id: ticket.id,
          qrCode: ticket.qrCode,
          qrImageUrl: ticket.qrImageUrl,
          status: ticket.status.code,
          usedAt: ticket.usedAt,
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
            datetime: ticket.event.datetime,
          },
          reservation: {
            id: ticket.reservation.id,
            totalAmount: ticket.reservation.totalAmount,
          },
          createdAt: ticket.createdAt,
        })),
      })
    } catch (error) {
      console.error('Error fetching tickets:', error)
      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al obtener los tickets',
      })
    }
  }

  /**
   * GET /tickets/:id
   * Get a specific ticket by ID
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const ticketId = params.id

      const ticket = await Ticket.query()
        .where('id', ticketId)
        .where('owner_id', user.id)
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('status')
        .preload('reservation')
        .firstOrFail()

      return response.ok({
        message: 'Ticket obtenido exitosamente',
        data: {
          id: ticket.id,
          qrCode: ticket.qrCode,
          qrImageUrl: ticket.qrImageUrl,
          status: ticket.status.code,
          statusName: ticket.status.name,
          usedAt: ticket.usedAt,
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
            description: ticket.event.description,
            datetime: ticket.event.datetime,
            price: ticket.event.price,
            venue: {
              id: ticket.event.venue.id,
              name: ticket.event.venue.name,
              address: ticket.event.venue.address,
            },
          },
          reservation: {
            id: ticket.reservation.id,
            quantity: ticket.reservation.quantity,
            totalAmount: ticket.reservation.totalAmount,
          },
          createdAt: ticket.createdAt,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Ticket no encontrado',
        })
      }

      console.error('Error fetching ticket:', error)
      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al obtener el ticket',
      })
    }
  }

  /**
   * POST /tickets/verify
   * Verify a QR code and get ticket information
   */
  async verify({ request, response }: HttpContext) {
    const { qr_code: qrCode } = request.only(['qr_code'])

    if (!qrCode) {
      return response.badRequest({
        error: 'Validation failed',
        message: 'El campo qr_code es requerido',
      })
    }

    try {
      // Validate QR format
      const qrService = new QrService()
      if (!qrService.verifyQRCode(qrCode)) {
        return response.badRequest({
          error: 'Invalid QR code',
          message: 'El código QR no tiene un formato válido',
        })
      }

      // Find ticket by QR code
      const ticket = await Ticket.query()
        .where('qr_code', qrCode)
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('status')
        .preload('owner')
        .firstOrFail()

      // Check if ticket is active
      const isActive = ticket.status.code === 'ACTIVE'

      return response.ok({
        message: 'QR verificado exitosamente',
        data: {
          valid: isActive,
          ticket: {
            id: ticket.id,
            status: ticket.status.code,
            statusName: ticket.status.name,
            usedAt: ticket.usedAt,
          },
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
            datetime: ticket.event.datetime,
            venue: {
              name: ticket.event.venue.name,
              address: ticket.event.venue.address,
            },
          },
          owner: {
            id: ticket.owner.id,
            firstName: ticket.owner.firstName,
            lastName: ticket.owner.lastName,
            email: ticket.owner.email,
          },
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Ticket no encontrado o código QR inválido',
        })
      }

      console.error('Error verifying ticket:', error)
      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al verificar el ticket',
      })
    }
  }

  /**
   * POST /tickets/:id/use
   * Mark a ticket as used (when scanned at event entrance)
   */
  async use({ params, response }: HttpContext) {
    const ticketId = params.id

    try {
      const ticket = await Ticket.query()
        .where('id', ticketId)
        .preload('status')
        .preload('event')
        .firstOrFail()

      // Check if ticket is active
      if (ticket.status.code !== 'ACTIVE') {
        return response.badRequest({
          error: 'Invalid ticket status',
          message: `El ticket no puede ser usado. Estado actual: ${ticket.status.name}`,
        })
      }

      // Check if ticket is already used
      if (ticket.usedAt) {
        return response.badRequest({
          error: 'Ticket already used',
          message: 'Este ticket ya fue utilizado',
          usedAt: ticket.usedAt,
        })
      }

      // Mark ticket as USED
      const usedStatus = await ticket.related('status').query().where('code', 'USED').firstOrFail()

      ticket.statusId = usedStatus.id
      ticket.usedAt = DateTime.now()
      await ticket.save()

      return response.ok({
        message: 'Ticket marcado como usado exitosamente',
        data: {
          id: ticket.id,
          status: 'USED',
          usedAt: ticket.usedAt,
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
          },
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Ticket no encontrado',
        })
      }

      console.error('Error using ticket:', error)
      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al marcar el ticket como usado',
      })
    }
  }
}
