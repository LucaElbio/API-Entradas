import transmit from '@adonisjs/transmit/services/main'
import db from '@adonisjs/lucid/services/db'

/**
 * Servicio para manejar estadísticas de ventas en tiempo real
 * Utiliza WebSockets (Transmit) para enviar actualizaciones automáticas
 */
export default class SalesStatsService {
  /**
   * Canal de Transmit para estadísticas de ventas
   */
  private static CHANNEL = 'sales/stats'

  /**
   * Emitir actualización de estadísticas globales
   */
  public static async broadcastGlobalStats() {
    try {
      const stats = await this.getGlobalStats()
      transmit.broadcast(this.CHANNEL, { type: 'global_stats', data: stats })
    } catch (error) {
      console.error('Error broadcasting global stats:', error)
    }
  }

  /**
   * Emitir actualización de estadísticas de un evento específico
   */
  public static async broadcastEventStats(eventId: number) {
    try {
      const stats = await this.getEventStats(eventId)
      transmit.broadcast(`sales/event/${eventId}`, { type: 'event_stats', data: stats })
      // También actualizar stats globales
      await this.broadcastGlobalStats()
    } catch (error) {
      console.error(`Error broadcasting event stats for event ${eventId}:`, error)
    }
  }

  /**
   * Emitir actualización de listado de ventas
   */
  public static async broadcastSalesList() {
    try {
      const salesList = await this.getSalesList()
      transmit.broadcast('sales/list', { type: 'sales_list', data: salesList })
    } catch (error) {
      console.error('Error broadcasting sales list:', error)
    }
  }

  /**
   * Obtener estadísticas globales
   */
  private static async getGlobalStats() {
    const globalStats = await db
      .from('events')
      .select(
        db.raw('COUNT(*) as total_events'),
        db.raw('SUM(tickets_total) as total_capacity'),
        db.raw('SUM(tickets_available) as total_available'),
        db.raw('SUM(tickets_total - tickets_available) as total_sold'),
        db.raw('SUM((tickets_total - tickets_available) * price) as total_revenue'),
        db.raw('SUM(tickets_total * price) as potential_revenue')
      )
      .first()

    const totalEvents = Number(globalStats?.total_events || 0)
    const totalCapacity = Number(globalStats?.total_capacity || 0)
    const totalAvailable = Number(globalStats?.total_available || 0)
    const totalSold = Number(globalStats?.total_sold || 0)
    const totalRevenue = Number(globalStats?.total_revenue || 0)
    const potentialRevenue = Number(globalStats?.potential_revenue || 0)

    const globalOccupancyPercentage =
      totalCapacity > 0 ? ((totalSold / totalCapacity) * 100).toFixed(2) : '0.00'

    const revenuePercentage =
      potentialRevenue > 0 ? ((totalRevenue / potentialRevenue) * 100).toFixed(2) : '0.00'

    return {
      totalEvents,
      totalCapacity,
      totalAvailable,
      totalSold,
      globalOccupancyPercentage: Number.parseFloat(globalOccupancyPercentage),
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      potentialRevenue: Number.parseFloat(potentialRevenue.toFixed(2)),
      revenuePercentage: Number.parseFloat(revenuePercentage),
    }
  }

  /**
   * Obtener estadísticas de un evento específico
   */
  private static async getEventStats(eventId: number) {
    const event = await db
      .from('events')
      .select(
        'id',
        'title',
        'datetime',
        'price',
        'tickets_total',
        'tickets_available',
        db.raw('(tickets_total - tickets_available) as tickets_sold')
      )
      .where('id', eventId)
      .first()

    if (!event) {
      return null
    }

    const ticketsSold = Number(event.tickets_sold)
    const occupancyPercentage =
      event.tickets_total > 0 ? ((ticketsSold / event.tickets_total) * 100).toFixed(2) : '0.00'
    const totalRevenue = ticketsSold * event.price
    const potentialRevenue = event.tickets_total * event.price

    return {
      eventId: event.id,
      title: event.title,
      datetime: event.datetime,
      ticketsTotal: event.tickets_total,
      ticketsAvailable: event.tickets_available,
      ticketsSold,
      occupancyPercentage: Number.parseFloat(occupancyPercentage),
      price: event.price,
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      potentialRevenue: Number.parseFloat(potentialRevenue.toFixed(2)),
      revenuePercentage:
        potentialRevenue > 0
          ? Number.parseFloat(((totalRevenue / potentialRevenue) * 100).toFixed(2))
          : 0,
    }
  }

  /**
   * Obtener listado de ventas
   */
  private static async getSalesList() {
    const events = await db
      .from('events')
      .select(
        'events.id',
        'events.title',
        'events.datetime',
        'events.price',
        'events.tickets_total',
        'events.tickets_available',
        'companies.name as company_name',
        'venues.name as venue_name'
      )
      .leftJoin('companies', 'events.company_id', 'companies.id')
      .leftJoin('venues', 'events.venue_id', 'venues.id')
      .orderBy('events.datetime', 'asc')
      .limit(50) // Limitar para no enviar demasiados datos

    return events.map((event) => {
      const ticketsSold = event.tickets_total - event.tickets_available
      const occupancyPercentage =
        event.tickets_total > 0 ? ((ticketsSold / event.tickets_total) * 100).toFixed(2) : '0.00'

      return {
        id: event.id,
        title: event.title,
        datetime: event.datetime,
        price: event.price,
        ticketsTotal: event.tickets_total,
        ticketsAvailable: event.tickets_available,
        ticketsSold,
        occupancyPercentage: Number.parseFloat(occupancyPercentage),
        company: event.company_name,
        venue: event.venue_name,
      }
    })
  }
}
