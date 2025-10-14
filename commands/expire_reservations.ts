import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ReservationExpirationService from '#services/reservation_expiration_service'

export default class ExpireReservations extends BaseCommand {
  static commandName = 'expire:reservations'
  static description =
    'Expire pending reservations that have passed their expiration time and return tickets to stock'

  static options: CommandOptions = {
    startApp: true, // Boot the application before running the command
  }

  async run() {
    this.logger.info('Starting reservation expiration process...')

    try {
      const service = new ReservationExpirationService()
      await service.expireReservations()
      this.logger.success('Reservation expiration process completed successfully')
    } catch (error) {
      this.logger.error('Error during reservation expiration process')
      this.logger.error(error)
      this.exitCode = 1
    }
  }
}
