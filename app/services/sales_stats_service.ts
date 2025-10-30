import transmit from '@adonisjs/transmit/services/main'
import Event from '#models/event'

/**
 * Servicio para manejar estadísticas de ventas en tiempo real
 * Utiliza WebSockets (Transmit) para enviar actualizaciones automáticas
 * Refactorizado para usar Lucid ORM en lugar de queries SQL raw
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
   * Obtener estadísticas globales usando Lucid ORM
   */
  private static async getGlobalStats() {
    // Obtener todos los eventos y calcular agregados en memoria
    // Para datasets grandes, considerar agregar índices o cache
    const events = await Event.query().select(
      'tickets_total',
      'tickets_available',
      'price'
    )

    let totalCapacity = 0
    let totalAvailable = 0
    let totalSold = 0
    let totalRevenue = 0
    let potentialRevenue = 0

    for (const event of events) {
      const sold = event.ticketsTotal - event.ticketsAvailable
      totalCapacity += event.ticketsTotal
      totalAvailable += event.ticketsAvailable
      totalSold += sold
      totalRevenue += sold * event.price
      potentialRevenue += event.ticketsTotal * event.price
    }

    const totalEvents = events.length
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
   * Obtener estadísticas de un evento específico usando Lucid ORM
   */
  private static async getEventStats(eventId: number) {
    const event = await Event.query()
      .where('id', eventId)
      .select('id', 'title', 'datetime', 'price', 'tickets_total', 'tickets_available')
      .first()

    if (!event) {
      return null
    }

    const ticketsSold = event.ticketsTotal - event.ticketsAvailable
    const occupancyPercentage =
      event.ticketsTotal > 0 ? ((ticketsSold / event.ticketsTotal) * 100).toFixed(2) : '0.00'
    const totalRevenue = ticketsSold * event.price
    const potentialRevenue = event.ticketsTotal * event.price

    return {
      eventId: event.id,
      title: event.title,
      datetime: event.datetime.toISO() || event.datetime.toString(),
      ticketsTotal: event.ticketsTotal,
      ticketsAvailable: event.ticketsAvailable,
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
   * Obtener listado de ventas usando Lucid ORM y relaciones
   */
  private static async getSalesList() {
    // Usar preload para cargar company y venue (evita N+1)
    const events = await Event.query()
      .preload('company', (query) => query.select('name'))
      .preload('venue', (query) => query.select('name'))
      .orderBy('datetime', 'asc')
      .limit(50) // Limitar para no enviar demasiados datos

    return events.map((event) => {
      const ticketsSold = event.ticketsTotal - event.ticketsAvailable
      const occupancyPercentage =
        event.ticketsTotal > 0 ? ((ticketsSold / event.ticketsTotal) * 100).toFixed(2) : '0.00'

      return {
        id: event.id,
        title: event.title,
        datetime: event.datetime.toISO() || event.datetime.toString(),
        price: event.price,
        ticketsTotal: event.ticketsTotal,
        ticketsAvailable: event.ticketsAvailable,
        ticketsSold,
        occupancyPercentage: Number.parseFloat(occupancyPercentage),
        company: event.company?.name || null,
        venue: event.venue?.name || null,
      }
    })
  }
}
