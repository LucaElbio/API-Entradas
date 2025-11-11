import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import ReservationStatus from '#models/reservation_status'
import Event from '#models/event'
import db from '@adonisjs/lucid/services/db'

// Constants
const RESERVATION_EXPIRATION_MINUTES = 15 // Tiempo de expiración de la reserva
const MAX_TICKETS_PER_RESERVATION = 10 // Máximo de tickets por reserva

export default class ReservationsController {
  /**
   * POST /reservations
   * Create a new reservation for a user and event
   *
   * This endpoint:
   * 1. Validates the event exists and has available tickets
   * 2. Creates a temporary reservation with PENDING status
   * 3. Decrements the event's available tickets (reserved)
   * 4. Generates a unique token for the reservation
   * 5. Sets an expiration time (15 minutes by default)
   *
   * The reservation will automatically expire if not paid within the time limit
   */
  async create({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const { event_id: eventId, quantity } = request.only(['event_id', 'quantity'])
    console.log('Creating reservation for user:', user.id, 'event:', eventId, 'quantity:', quantity)
    // Validate input
    if (!eventId || !quantity) {
      return response.badRequest({
        error: 'Validation failed',
        message: 'Los campos event_id y quantity son requeridos',
      })
    }

    // Validate quantity
    if (quantity <= 0) {
      return response.badRequest({
        error: 'Invalid quantity',
        message: 'La cantidad debe ser mayor a 0',
      })
    }

    if (quantity > MAX_TICKETS_PER_RESERVATION) {
      return response.badRequest({
        error: 'Quantity exceeded',
        message: `No se pueden reservar más de ${MAX_TICKETS_PER_RESERVATION} tickets por reserva`,
      })
    }

    // Use transaction to ensure data consistency
    const trx = await db.transaction()

    try {
      console.log('Starting reservation transaction for user:', user.id)
      // 1. Find the event and lock the row to prevent race conditions
      const event = await Event.query({ client: trx })
        .where('id', eventId)
        .forUpdate() // Lock the row for update
        .firstOrFail()

      console.log('Event found:', event.id, 'Tickets available:', event.ticketsAvailable)

      // 2. Check if there are enough available tickets
      if (event.ticketsAvailable < quantity) {
        await trx.rollback()
        return response.badRequest({
          error: 'Insufficient stock',
          message: `No hay suficientes tickets disponibles. Disponibles: ${event.ticketsAvailable}, solicitados: ${quantity}`,
        })
      }

      console.log('Sufficient tickets available for reservation')

      // 3. Calculate total amount
      const totalAmount = event.price * quantity

      // 5. Set expiration time (15 minutes from now)
      const expiresAt = DateTime.now().plus({ minutes: RESERVATION_EXPIRATION_MINUTES })

      console.log('Reservation will expire at:', expiresAt.toISO())
      // 6. Get PENDING status
      const pendingStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'PENDING')
        .firstOrFail()

      console.log('Pending status ID:', pendingStatus)
      // 7. Create the reservation
      const reservation = await Reservation.create(
        {
          userId: user.id,
          eventId: event.id,
          statusId: pendingStatus.id,
          quantity: quantity,
          totalAmount: totalAmount,
          expiresAt: expiresAt,
        },
        { client: trx }
      )

      // 8. Decrement available tickets (reserved temporarily)
      event.ticketsAvailable -= quantity
      console.log('Decrementing tickets available. Availability:', event.ticketsAvailable)
      await event.save()
      console.log('Decremented tickets available. New availability:', event.ticketsAvailable)
      // 9. Commit transaction
      await trx.commit()

      // 10. Load relations for response
      await reservation.load('event', (eventQuery) => {
        eventQuery.preload('venue')
      })
      console.log('Loaded event relation for reservation')
      await reservation.load('status')
      console.log('Loaded status relation for reservation')
      // 11. Return success response
      return response.created({
        message: 'Reserva creada exitosamente',
        data: {
          reservation: {
            id: reservation.id,
            quantity: reservation.quantity,
            totalAmount: reservation.totalAmount,
            status: reservation.status.name,
            expiresAt: reservation.expiresAt.toISO(),
            expiresInMinutes: RESERVATION_EXPIRATION_MINUTES,
            event: {
              id: reservation.event.id,
              title: reservation.event.title,
              datetime: reservation.event.datetime.toISO(),
              price: reservation.event.price,
              venue: {
                name: reservation.event.venue.name,
                address: reservation.event.venue.address,
              },
            },
          },
        },
      })
    } catch (error) {
      // Rollback transaction on error
      await trx.rollback()
      console.log('Transaction rolled back due to error', error)
      // Handle not found errors
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Evento no encontrado',
        })
      }

      // Log error for debugging
      console.error('Error creating reservation:', error)

      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al crear la reserva',
      })
    }
  }

  /**
   * GET /reservations
   * Get all reservations for the authenticated user
   */
  async index({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      const reservations = await Reservation.query()
        .where('userId', user.id)
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('status')
        .orderBy('createdAt', 'desc')

      return response.ok({
        message: 'Reservas obtenidas exitosamente',
        data: {
          reservations: reservations.map((reservation) => ({
            id: reservation.id,
            quantity: reservation.quantity,
            totalAmount: reservation.totalAmount,
            status: reservation.status.name,
            expiresAt: reservation.expiresAt.toISO(),
            createdAt: reservation.createdAt.toISO(),
            event: {
              id: reservation.event.id,
              title: reservation.event.title,
              datetime: reservation.event.datetime.toISO(),
              price: reservation.event.price,
              venue: {
                name: reservation.event.venue.name,
                address: reservation.event.venue.address,
              },
            },
          })),
        },
      })
    } catch (error) {
      console.error('Error fetching reservations:', error)

      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al obtener las reservas',
      })
    }
  }

  /**
   * GET /reservations/:id
   * Get a specific reservation by ID
   */
  async show({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { id } = params

    try {
      const reservation = await Reservation.query()
        .where('id', id)
        .where('userId', user.id)
        .preload('event', (eventQuery) => {
          eventQuery.preload('venue')
        })
        .preload('status')
        .firstOrFail()

      return response.ok({
        message: 'Reserva obtenida exitosamente',
        data: {
          reservation: {
            id: reservation.id,
            quantity: reservation.quantity,
            totalAmount: reservation.totalAmount,
            status: reservation.status.name,
            expiresAt: reservation.expiresAt.toISO(),
            createdAt: reservation.createdAt.toISO(),
            event: {
              id: reservation.event.id,
              title: reservation.event.title,
              datetime: reservation.event.datetime.toISO(),
              price: reservation.event.price,
              venue: {
                name: reservation.event.venue.name,
                address: reservation.event.venue.address,
              },
            },
          },
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Reserva no encontrada',
        })
      }

      console.error('Error fetching reservation:', error)

      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al obtener la reserva',
      })
    }
  }

  /**
   * DELETE /reservations/:id
   * Cancel a reservation and return tickets to stock
   */
  async cancel({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { id } = params

    const trx = await db.transaction()

    try {
      // 1. Find the reservation and lock it
      const reservation = await Reservation.query({ client: trx })
        .where('id', id)
        .where('userId', user.id)
        .preload('status')
        .preload('event')
        .forUpdate()
        .firstOrFail()

      // 2. Check if reservation can be cancelled (only PENDING reservations)
      const pendingStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'PENDING')
        .firstOrFail()

      if (reservation.statusId !== pendingStatus.id) {
        await trx.rollback()
        return response.badRequest({
          error: 'Invalid status',
          message: 'Solo se pueden cancelar reservas en estado PENDING',
        })
      }

      // 3. Get CANCELLED status
      const cancelledStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'CANCELLED')
        .firstOrFail()

      // 4. Update reservation status to CANCELLED
      reservation.statusId = cancelledStatus.id
      await reservation.save()

      // 5. Return tickets to stock
      const event = await Event.query({ client: trx })
        .where('id', reservation.eventId)
        .forUpdate()
        .firstOrFail()

      event.ticketsAvailable += reservation.quantity
      await event.save()

      // 6. Commit transaction
      await trx.commit()

      return response.ok({
        message: 'Reserva cancelada exitosamente',
        data: {
          reservation: {
            id: reservation.id,
            status: 'CANCELLED',
            quantity: reservation.quantity,
          },
        },
      })
    } catch (error) {
      await trx.rollback()

      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          error: 'Not found',
          message: 'Reserva no encontrada',
        })
      }

      console.error('Error cancelling reservation:', error)

      return response.internalServerError({
        error: 'Internal server error',
        message: 'Error al cancelar la reserva',
      })
    }
  }
}
