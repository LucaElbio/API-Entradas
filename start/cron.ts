import cron from 'node-cron'
import ReservationExpirationService from '#services/reservation_expiration_service'

/**
 * Cron Jobs Configuration
 *
 * This file sets up scheduled tasks that run automatically
 */

console.log('⏰ Initializing cron jobs...')

// Expire reservations every minute
// Pattern: * * * * *
// ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │
// │ │ │ │ └─ Day of week (0-7, Sunday is 0 or 7)
// │ │ │ └─── Month (1-12)
// │ │ └───── Day of month (1-31)
// │ └─────── Hour (0-23)
// └───────── Minute (0-59)

cron.schedule(
  '* * * * *', // Every minute
  async () => {
    try {
      const service = new ReservationExpirationService()
      await service.expireReservations()
    } catch (error) {
      console.error('❌ Cron job failed:', error)
    }
  },
  {
    timezone: 'America/Argentina/Buenos_Aires', // Ajusta según tu zona horaria
  }
)

console.log('✅ Cron jobs initialized successfully')
console.log('   - Reservation expiration: every minute')
