import { DateTime } from 'luxon'
import Reservation from '#models/reservation'
import ReservationStatus from '#models/reservation_status'
import Event from '#models/event'
import db from '@adonisjs/lucid/services/db'

/**
 * Service to handle automatic expiration of reservations
 *
 * This service finds all pending reservations that have expired
 * and automatically:
 * 1. Changes their status to EXPIRED
 * 2. Returns the reserved tickets back to the event stock
 */
export default class ReservationExpirationService {
  /**
   * Expire all pending reservations that have passed their expiration time
   */
  async expireReservations(): Promise<void> {
    console.log('🔍 Checking for expired reservations...')

    const trx = await db.transaction()

    try {
      // 1. Get PENDING and EXPIRED status IDs
      const pendingStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'PENDING')
        .firstOrFail()

      const expiredStatus = await ReservationStatus.query({ client: trx })
        .where('code', 'EXPIRED')
        .firstOrFail()

      // 2. Find all pending reservations that have expired
      const expiredReservations = await Reservation.query({ client: trx })
        .where('statusId', pendingStatus.id)
        .where('expiresAt', '<', DateTime.now().toSQL())
        .preload('event')

      if (expiredReservations.length === 0) {
        console.log('✅ No expired reservations found')
        await trx.commit()
        return
      }

      console.log(`⏰ Found ${expiredReservations.length} expired reservation(s)`)

      // 3. Process each expired reservation
      for (const reservation of expiredReservations) {
        // Lock the event row to prevent race conditions
        const event = await Event.query({ client: trx })
          .where('id', reservation.eventId)
          .forUpdate()
          .firstOrFail()

        // Return tickets to stock
        event.ticketsAvailable += reservation.quantity

        // Ensure we don't exceed total tickets
        if (event.ticketsAvailable > event.ticketsTotal) {
          event.ticketsAvailable = event.ticketsTotal
        }

        await event.save()

        // Update reservation status to EXPIRED
        reservation.statusId = expiredStatus.id
        await reservation.save()

        console.log(
          `  ✓ Expired reservation #${reservation.id}: returned ${reservation.quantity} ticket(s) to event #${event.id}`
        )
      }

      // 4. Commit transaction
      await trx.commit()

      console.log(`✅ Successfully expired ${expiredReservations.length} reservation(s)`)
    } catch (error) {
      await trx.rollback()
      console.error('❌ Error expiring reservations:', error)
      throw error
    }
  }
}
