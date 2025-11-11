import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Ticket from '../../models/ticket.js'
import TicketStatus from '../../models/ticket_status.js'
import TicketTransfer from '../../models/ticket_transfer.js'
import TransferStatus from '../../models/transfer_status.js'
import User from '../../models/user.js'
import db from '@adonisjs/lucid/services/db'
import QrService from '#services/qr_service'
import Reservation from '#models/reservation'

export default class TicketsController {
  /**
   * GET /api/tickets/transfers/pending
   * Ver solicitudes de transferencia pendientes recibidas
   */
  public async pendingTransfers({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const pendingStatus = await TransferStatus.findByOrFail('code', 'PENDING')

      const transfers = await TicketTransfer.query()
        .where('to_user_id', user.id)
        .where('status_id', pendingStatus.id)
        .preload('ticket', (ticketQuery) => {
          ticketQuery.preload('event', (eventQuery) => {
            eventQuery.preload('venue')
          })
        })
        .preload('fromUser')
        .orderBy('created_at', 'desc')

      return response.json({
        message: 'Transferencias pendientes',
        data: transfers.map((transfer) => ({
          id: transfer.id,
          ticketId: transfer.ticketId,
          expiresAt: transfer.expiresAt,
          createdAt: transfer.createdAt,
          ticket: {
            id: transfer.ticket.id,
            qrCode: transfer.ticket.qrCode,
          },
          event: {
            id: transfer.ticket.event.id,
            title: transfer.ticket.event.title,
            datetime: transfer.ticket.event.datetime,
            venue: {
              name: transfer.ticket.event.venue.name,
              address: transfer.ticket.event.venue.address,
            },
          },
          from: {
            id: transfer.fromUser.id,
            name: `${transfer.fromUser.firstName} ${transfer.fromUser.lastName}`,
            email: transfer.fromUser.email,
          },
        })),
      })
    } catch (error) {
      console.error('Error en pendingTransfers:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/tickets/mine
   * Ver mis entradas organizadas por eventos pasados y futuros
   */
  public async mine({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const now = DateTime.now()

      const [activeStatus, usedStatus] = await Promise.all([
        TicketStatus.findByOrFail('code', 'ACTIVE'),
        TicketStatus.findByOrFail('code', 'USED'),
      ])

      // Obtener todas las entradas del usuario
      const tickets = await Ticket.query()
        .where('owner_id', user.id)
        .whereIn('status_id', [activeStatus.id, usedStatus.id])
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue').preload('company')
        })
        .orderBy('created_at', 'desc')

      // Separar por eventos futuros y pasados
      const futureTickets = tickets.filter((ticket) => ticket.event.datetime > now)
      const pastTickets = tickets.filter((ticket) => ticket.event.datetime <= now)

      return response.json({
        message: 'Mis entradas',
        data: {
          future: futureTickets.map((ticket) => ({
            id: ticket.id,
            qrCode: ticket.qrCode,
            qrImageUrl: ticket.qrImageUrl,
            statusId: ticket.statusId,
            usedAt: ticket.usedAt,
            event: {
              id: ticket.event.id,
              title: ticket.event.title,
              datetime: ticket.event.datetime,
              venue: {
                name: ticket.event.venue.name,
                address: ticket.event.venue.address,
              },
            },
          })),
          past: pastTickets.map((ticket) => ({
            id: ticket.id,
            qrCode: ticket.qrCode,
            qrImageUrl: ticket.qrImageUrl,
            statusId: ticket.statusId,
            usedAt: ticket.usedAt,
            event: {
              id: ticket.event.id,
              title: ticket.event.title,
              datetime: ticket.event.datetime,
              venue: {
                name: ticket.event.venue.name,
                address: ticket.event.venue.address,
              },
            },
          })),
        },
      })
    } catch (error) {
      console.error('Error en mine:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * POST /api/tickets/:id/transfer
   * Iniciar transferencia de entrada
   */
  public async transfer({ auth, params, request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user!
      const ticketId = Number(params.id)
      const { receiverDni } = request.only(['receiverDni'])

      if (!receiverDni) {
        await trx.rollback()
        return response.status(400).json({
          message: 'El DNI del receptor es requerido',
        })
      }

      const now = DateTime.now()
      const activeStatus = await TicketStatus.findByOrFail('code', 'ACTIVE')
      const pendingStatus = await TransferStatus.findByOrFail('code', 'PENDING')

      const ticket = await Ticket.query({ client: trx })
        .where('id', ticketId)
        .where('owner_id', user.id)
        .where('status_id', activeStatus.id)
        .preload('event')
        .first()

      if (!ticket) {
        await trx.rollback()
        return response.status(404).json({
          message: 'Entrada no encontrada o no te pertenece',
        })
      }

      if (ticket.event.datetime <= now) {
        await trx.rollback()
        return response.status(400).json({
          message: 'No se puede transferir una entrada de un evento que ya ocurrió',
        })
      }

      const receiver = await User.query({ client: trx }).where('dni', receiverDni).first()

      if (!receiver) {
        await trx.rollback()
        return response.status(404).json({
          message: 'Usuario receptor no encontrado',
        })
      }

      if (receiver.id === user.id) {
        await trx.rollback()
        return response.status(400).json({
          message: 'No puedes transferir una entrada a ti mismo',
        })
      }

      const existingTransfer = await TicketTransfer.query({ client: trx })
        .where('ticket_id', ticketId)
        .where('status_id', pendingStatus.id)
        .first()

      if (existingTransfer) {
        await trx.rollback()
        return response.status(400).json({
          message: 'Ya existe una transferencia pendiente para esta entrada',
        })
      }

      const transfer = await TicketTransfer.create(
        {
          ticketId: ticket.id,
          fromUserId: user.id,
          toUserId: receiver.id,
          statusId: pendingStatus.id,
          receiverContact: receiverDni,
          receiverType: 'dni',
          expiresAt: now.plus({ hours: 12 }),
          oldQr: ticket.qrCode,
        },
        { client: trx }
      )

      await trx.commit()

      return response.status(201).json({
        message: 'Solicitud de transferencia enviada',
        data: {
          transferId: transfer.id,
          ticketId: ticket.id,
          receiver: {
            id: receiver.id,
            name: `${receiver.firstName} ${receiver.lastName}`,
            dni: receiver.dni,
          },
          expiresAt: transfer.expiresAt,
        },
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error en transfer:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * POST /api/tickets/:id/transfer/accept
   * Aceptar transferencia de entrada
   */
  public async acceptTransfer({ auth, params, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user!
      const ticketId = Number(params.id)
      const now = DateTime.now()

      const pendingStatus = await TransferStatus.findByOrFail('code', 'PENDING')
      const acceptedStatus = await TransferStatus.findByOrFail('code', 'ACCEPTED')
      const expiredStatus = await TransferStatus.findByOrFail('code', 'EXPIRED')

      const transfer = await TicketTransfer.query({ client: trx })
        .where('ticket_id', ticketId)
        .where('to_user_id', user.id)
        .where('status_id', pendingStatus.id)
        .preload('ticket', (ticketQuery) => {
          ticketQuery.preload('event')
        })
        .first()

      if (!transfer) {
        await trx.rollback()
        return response.status(404).json({
          message: 'Transferencia no encontrada o no autorizada',
        })
      }

      if (transfer.expiresAt <= now) {
        transfer.useTransaction(trx)
        transfer.statusId = expiredStatus.id
        await transfer.save()

        await trx.commit()

        return response.status(400).json({
          message: 'La solicitud de transferencia ha expirado',
        })
      }

      const qrService = new QrService()
      const ticket = transfer.ticket
      ticket.useTransaction(trx)
      const reservation = await Reservation.query({ client: trx })
        .where('id', ticket.reservationId)
        .firstOrFail()
      const { qrCode } = await qrService.generateTicketQR(
        ticket.id,
        reservation.eventId,
        reservation.userId
      )
      ticket.ownerId = user.id
      ticket.qrCode = qrCode
      await ticket.save()

      transfer.useTransaction(trx)
      transfer.statusId = acceptedStatus.id
      transfer.respondedAt = now
      await transfer.save()

      await trx.commit()

      return response.json({
        message: 'Transferencia aceptada exitosamente',
        data: {
          ticketId: ticket.id,
          newQrCode: ticket.qrCode,
          oldQrCode: transfer.oldQr,
          event: {
            id: ticket.event.id,
            title: ticket.event.title,
            datetime: ticket.event.datetime,
          },
        },
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error en acceptTransfer:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * POST /api/tickets/:id/transfer/reject
   * Rechazar transferencia de entrada
   */
  public async rejectTransfer({ auth, params, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user!
      const ticketId = Number(params.id)
      const now = DateTime.now()

      const pendingStatus = await TransferStatus.findByOrFail('code', 'PENDING')
      const rejectedStatus = await TransferStatus.findByOrFail('code', 'REJECTED')
      const expiredStatus = await TransferStatus.findByOrFail('code', 'EXPIRED')

      const transfer = await TicketTransfer.query({ client: trx })
        .where('ticket_id', ticketId)
        .where('to_user_id', user.id)
        .where('status_id', pendingStatus.id)
        .first()

      if (!transfer) {
        await trx.rollback()
        return response.status(404).json({
          message: 'Transferencia no encontrada o no autorizada',
        })
      }

      if (transfer.expiresAt <= now) {
        transfer.useTransaction(trx)
        transfer.statusId = expiredStatus.id
        await transfer.save()

        await trx.commit()

        return response.status(400).json({
          message: 'La solicitud de transferencia ha expirado',
        })
      }

      transfer.useTransaction(trx)
      transfer.statusId = rejectedStatus.id
      transfer.respondedAt = now
      await transfer.save()

      await trx.commit()

      return response.json({
        message: 'Transferencia rechazada',
        data: {
          transferId: transfer.id,
        },
      })
    } catch (error) {
      await trx.rollback()
      console.error('Error en rejectTransfer:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

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
   * IMPORTANT: This endpoint ONLY verifies the QR validity, it does NOT change the ticket status
   * Use the /tickets/:id/use endpoint to mark a ticket as USED after verification
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
      // Validate QR format first
      const qrService = new QrService()
      if (!qrService.verifyQRCode(qrCode)) {
        return response.badRequest({
          error: 'Invalid QR code',
          message: 'El código QR no tiene un formato válido',
        })
      }

      // Find ticket by QR code in database
      const ticket = await Ticket.query()
        .where('qr_code', qrCode)
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('status')
        .preload('owner')
        .firstOrFail()

      // Check if ticket is valid (ACTIVE status)
      // NOTE: This endpoint ONLY checks the validity, it does NOT change the ticket status
      // The ticket status is only changed when using the /tickets/:id/use endpoint
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
   * Mark a ticket as USED (when scanned at event entrance)
   * IMPORTANT: This endpoint changes the ticket status to USED permanently
   * It should be called ONLY after verifying the ticket with /tickets/verify
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
