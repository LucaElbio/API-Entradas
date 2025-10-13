import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import Ticket from '../../models/ticket.js'
import TicketTransfer from '../../models/ticket_transfer.js'
import User from '../../models/user.js'
import db from '@adonisjs/lucid/services/db'

export default class TicketsController {
  /**
   * GET /api/tickets/mine
   * Ver mis entradas organizadas por eventos pasados y futuros
   */
  public async mine({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      const now = DateTime.now()

      // Obtener ID del status "active"
      const activeStatus = await db.from('ticket_statuses').where('code', 'active').first()
      const usedStatus = await db.from('ticket_statuses').where('code', 'used').first()

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
    try {
      const user = auth.user!
      const ticketId = params.id
      const { receiverDni } = request.only(['receiverDni'])

      if (!receiverDni) {
        return response.status(400).json({
          message: 'El DNI del receptor es requerido',
        })
      }

      // Obtener ID del status "active"
      const activeStatus = await db.from('ticket_statuses').where('code', 'active').first()
      console.log('DEBUG - activeStatus:', activeStatus)
      console.log('DEBUG - user.id:', user.id)
      console.log('DEBUG - ticketId:', ticketId)

      // Primero verificar si el ticket existe sin filtros
      const ticketExists = await Ticket.query().where('id', ticketId).first()
      console.log('DEBUG - ticket exists (no filters):', ticketExists ? `ID: ${ticketExists.id}, owner_id: ${ticketExists.ownerId}, status_id: ${ticketExists.statusId}` : 'null')

      // Validar que la entrada exista y pertenezca al usuario
      const ticket = await Ticket.query()
        .where('id', ticketId)
        .where('owner_id', user.id)
        .where('status_id', activeStatus.id)
        .preload('event')
        .first()

      console.log('DEBUG - ticket found:', ticket ? `ID: ${ticket.id}` : 'null')

      if (!ticket) {
        return response.status(404).json({
          message: 'Entrada no encontrada o no te pertenece',
        })
      }

      // Validar que el evento no haya ocurrido
      if (ticket.event.datetime <= DateTime.now()) {
        return response.status(400).json({
          message: 'No se puede transferir una entrada de un evento que ya ocurrió',
        })
      }

      // Buscar al receptor por DNI
      const receiver = await User.findBy('dni', receiverDni)

      if (!receiver) {
        return response.status(404).json({
          message: 'Usuario receptor no encontrado',
        })
      }

      if (receiver.id === user.id) {
        return response.status(400).json({
          message: 'No puedes transferir una entrada a ti mismo',
        })
      }

      // Obtener ID del status "pending"
      const pendingStatus = await db.from('transfer_statuses').where('code', 'pending').first()

      // Verificar que no haya una transferencia pendiente
      const existingTransfer = await TicketTransfer.query()
        .where('ticket_id', ticketId)
        .where('status_id', pendingStatus.id)
        .first()

      if (existingTransfer) {
        return response.status(400).json({
          message: 'Ya existe una transferencia pendiente para esta entrada',
        })
      }

      // Crear la transferencia
      const expiresAt = DateTime.now().plus({ hours: 1 })

      const transfer = await TicketTransfer.create({
        ticketId: ticket.id,
        fromUserId: user.id,
        toUserId: receiver.id,
        statusId: pendingStatus.id,
        receiverContact: receiverDni,
        receiverType: 'dni',
        expiresAt,
        oldQr: ticket.qrCode,
      })

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
    try {
      const user = auth.user!
      const ticketId = params.id

      // Obtener IDs de estados
      const pendingStatus = await db.from('transfer_statuses').where('code', 'pending').first()
      const acceptedStatus = await db.from('transfer_statuses').where('code', 'accepted').first()

      // Buscar la transferencia pendiente
      const transfer = await TicketTransfer.query()
        .where('ticket_id', ticketId)
        .where('to_user_id', user.id)
        .where('status_id', pendingStatus.id)
        .preload('ticket', (ticketQuery) => {
          ticketQuery.preload('event')
        })
        .first()

      if (!transfer) {
        return response.status(404).json({
          message: 'Transferencia no encontrada o no autorizada',
        })
      }

      // Verificar que no haya expirado
      if (transfer.expiresAt <= DateTime.now()) {
        const expiredStatus = await db.from('transfer_statuses').where('code', 'expired').first()
        transfer.statusId = expiredStatus.id
        await transfer.save()

        return response.status(400).json({
          message: 'La solicitud de transferencia ha expirado',
        })
      }

      // Generar nuevo QR code
      const newQrCode = this.generateQrCode()

      // Actualizar la entrada
      const ticket = transfer.ticket
      ticket.ownerId = user.id
      ticket.qrCode = newQrCode
      await ticket.save()

      // Actualizar la transferencia
      transfer.statusId = acceptedStatus.id
      transfer.respondedAt = DateTime.now()
      await transfer.save()

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
    try {
      const user = auth.user!
      const ticketId = params.id

      // Obtener IDs de estados
      const pendingStatus = await db.from('transfer_statuses').where('code', 'pending').first()
      const rejectedStatus = await db.from('transfer_statuses').where('code', 'rejected').first()

      // Buscar la transferencia pendiente
      const transfer = await TicketTransfer.query()
        .where('ticket_id', ticketId)
        .where('to_user_id', user.id)
        .where('status_id', pendingStatus.id)
        .first()

      if (!transfer) {
        return response.status(404).json({
          message: 'Transferencia no encontrada o no autorizada',
        })
      }

      // Verificar que no haya expirado
      if (transfer.expiresAt <= DateTime.now()) {
        const expiredStatus = await db.from('transfer_statuses').where('code', 'expired').first()
        transfer.statusId = expiredStatus.id
        await transfer.save()

        return response.status(400).json({
          message: 'La solicitud de transferencia ha expirado',
        })
      }

      // Actualizar la transferencia
      transfer.statusId = rejectedStatus.id
      transfer.respondedAt = DateTime.now()
      await transfer.save()

      return response.json({
        message: 'Transferencia rechazada',
        data: {
          transferId: transfer.id,
        },
      })
    } catch (error) {
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
