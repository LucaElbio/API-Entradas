import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import Ticket from '../../models/ticket.js'
import TicketStatus from '../../models/ticket_status.js'
import TicketTransfer from '../../models/ticket_transfer.js'
import TransferStatus from '../../models/transfer_status.js'
import User from '../../models/user.js'
import db from '@adonisjs/lucid/services/db'
import QrService from '#services/qr_service'

export default class TicketsController {
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
        .preload('status')
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('user')
        .firstOrFail()
      const { newQrCode } = await qrService.generateTicketQR(
        ticket.id,
        reservation.eventId,
        reservation.userId
      )
      ticket.ownerId = user.id
      ticket.qrCode = newQrCode
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
   * Generar código QR único
   */
  private generateQrCode(): string {
    const timestamp = Date.now()
    const randomBytes = crypto.randomBytes(16).toString('hex')
    return `TICKET-${timestamp}-${randomBytes}`
  }
}
