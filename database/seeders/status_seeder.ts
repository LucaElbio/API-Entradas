import { BaseSeeder } from '@adonisjs/lucid/seeders'
import EventStatus from '#models/event_status'
import ReservationStatus from '#models/reservation_status'
import PaymentStatus from '#models/payment_status'
import TicketStatus from '#models/ticket_status'

export default class extends BaseSeeder {
  async run() {
    // Seed Event Statuses
    await EventStatus.updateOrCreateMany('code', [
      { code: 'DRAFT', name: 'Borrador' },
      { code: 'PUBLISHED', name: 'Publicado' },
      { code: 'CANCELLED', name: 'Cancelado' },
      { code: 'COMPLETED', name: 'Completado' },
    ])

    // Seed Reservation Statuses
    await ReservationStatus.updateOrCreateMany('code', [
      { code: 'PENDING', name: 'Pendiente' },
      { code: 'PAID', name: 'Pagado' },
      { code: 'EXPIRED', name: 'Expirado' },
      { code: 'CANCELLED', name: 'Cancelado' },
    ])

    // Seed Payment Statuses
    await PaymentStatus.updateOrCreateMany('code', [
      { code: 'PENDING', name: 'Pendiente' },
      { code: 'APPROVED', name: 'Aprobado' },
      { code: 'REJECTED', name: 'Rechazado' },
      { code: 'REFUNDED', name: 'Reembolsado' },
    ])

    // Seed Ticket Statuses
    await TicketStatus.updateOrCreateMany('code', [
      { code: 'ACTIVE', name: 'Activo' },
      { code: 'USED', name: 'Usado' },
      { code: 'CANCELLED', name: 'Cancelado' },
      { code: 'TRANSFERRED', name: 'Transferido' },
    ])
  }
}
