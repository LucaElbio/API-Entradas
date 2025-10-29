import type { HttpContext } from '@adonisjs/core/http'
import Event from '../../models/event.js'
import db from '@adonisjs/lucid/services/db'

export default class EventsController {
  public async index({ request, response }: HttpContext) {
    try {
      const { date, location, type, page = 1, limit = 10 } = request.qs()

      const query = Event.query().preload('venue').preload('company')

      // Filtros
      if (date) {
        query.whereRaw('DATE(datetime) = ?', [date])
      }

      if (location) {
        query.whereHas('venue', (venueQuery) => {
          venueQuery
            .where('address', 'like', `%${location}%`)
            .orWhere('name', 'like', `%${location}%`)
        })
      }

      if (type) {
        query.where('title', 'like', `%${type}%`)
      }

      query.where('tickets_available', '>', 0)
      query.orderBy('datetime', 'asc')

      const events = await query.paginate(page, limit)

      if (events.total === 0) {
        return response.status(404).json({
          message: 'No se encontraron eventos con los filtros aplicados',
          data: [],
          meta: events.getMeta(),
        })
      }

      return response.json({
        message: 'Eventos encontrados',
        data: events.serialize().data,
        meta: events.getMeta(),
      })
    } catch (error) {
      console.error('Error en index:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const eventId = params.id

      const event = await Event.query()
        .where('id', eventId)
        .preload('venue')
        .preload('company')
        .first()

      if (!event) {
        return response.status(404).json({
          message: 'Evento no encontrado',
        })
      }

      return response.json({
        message: 'Detalle del evento',
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          datetime: event.datetime,
          price: event.price,
          ticketsAvailable: event.ticketsAvailable,
          ticketsTotal: event.ticketsTotal,
          venue: {
            name: event.venue.name,
            address: event.venue.address,
            capacity: event.venue.capacity,
          },
          company: {
            name: event.company.name,
          },
        },
      })
    } catch (error) {
      console.error('Error en show:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/eventos/ventas
   * Endpoint para listar todos los eventos con entradas vendidas y disponibles
   * Acceso: Solo administradores
   */
  public async ventas({ request, response }: HttpContext) {
    try {
      const { page = 1, limit = 10, sortBy = 'datetime', order = 'asc' } = request.qs()

      // Consulta con cálculo de entradas vendidas
      const query = db
        .from('events')
        .select(
          'events.id',
          'events.title',
          'events.datetime',
          'events.price',
          'events.tickets_total',
          'events.tickets_available',
          'companies.name as company_name',
          'venues.name as venue_name',
          'venues.address as venue_address'
        )
        .leftJoin('companies', 'events.company_id', 'companies.id')
        .leftJoin('venues', 'events.venue_id', 'venues.id')
        .orderBy(`events.${sortBy}`, order)

      // Paginación
      const offset = (page - 1) * limit
      const events = await query.limit(limit).offset(offset)

      // Obtener total de registros para paginación
      const totalQuery = await db.from('events').count('* as total').first()
      const total = totalQuery?.total || 0

      // Calcular entradas vendidas y porcentaje de ocupación
      const eventsWithStats = events.map((event) => {
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
          venue: {
            name: event.venue_name,
            address: event.venue_address,
          },
        }
      })

      return response.json({
        message: 'Estadísticas de ventas de eventos',
        data: eventsWithStats,
        meta: {
          total: Number(total),
          perPage: Number(limit),
          currentPage: Number(page),
          lastPage: Math.ceil(Number(total) / Number(limit)),
        },
      })
    } catch (error) {
      console.error('Error en ventas:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/eventos/estadisticas
   * Endpoint para obtener métricas adicionales (% ocupación, ingresos totales)
   * Acceso: Solo administradores
   */
  public async estadisticas({ request, response }: HttpContext) {
    try {
      const { eventId } = request.qs()

      // Si se especifica un evento, obtener estadísticas de ese evento
      if (eventId) {
        const event = await Event.query().where('id', eventId).preload('venue').first()

        if (!event) {
          return response.status(404).json({
            message: 'Evento no encontrado',
          })
        }

        const ticketsSold = event.ticketsTotal - event.ticketsAvailable
        const occupancyPercentage =
          event.ticketsTotal > 0 ? ((ticketsSold / event.ticketsTotal) * 100).toFixed(2) : '0.00'
        const totalRevenue = ticketsSold * event.price
        const potentialRevenue = event.ticketsTotal * event.price

        return response.json({
          message: 'Estadísticas del evento',
          data: {
            eventId: event.id,
            title: event.title,
            datetime: event.datetime,
            venue: event.venue.name,
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
          },
        })
      }

      // Estadísticas globales
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

      // Top 5 eventos más vendidos
      const topEvents = await db
        .from('events')
        .select(
          'events.id',
          'events.title',
          'events.tickets_total',
          'events.tickets_available',
          'events.price',
          db.raw('(events.tickets_total - events.tickets_available) as tickets_sold'),
          db.raw(
            'ROUND(((events.tickets_total - events.tickets_available) * 100.0 / events.tickets_total), 2) as occupancy_percentage'
          )
        )
        .orderBy('tickets_sold', 'desc')
        .limit(5)

      // Eventos con baja ocupación (< 30%)
      const lowOccupancyEvents = await db
        .from('events')
        .select(
          'events.id',
          'events.title',
          'events.datetime',
          'events.tickets_total',
          'events.tickets_available',
          db.raw('(events.tickets_total - events.tickets_available) as tickets_sold'),
          db.raw(
            'ROUND(((events.tickets_total - events.tickets_available) * 100.0 / events.tickets_total), 2) as occupancy_percentage'
          )
        )
        .whereRaw(
          '((events.tickets_total - events.tickets_available) * 100.0 / events.tickets_total) < 30'
        )
        .andWhere('events.tickets_total', '>', 0)
        .orderBy('occupancy_percentage', 'asc')
        .limit(5)

      return response.json({
        message: 'Estadísticas globales del sistema',
        data: {
          global: {
            totalEvents,
            totalCapacity,
            totalAvailable,
            totalSold,
            globalOccupancyPercentage: Number.parseFloat(globalOccupancyPercentage),
            totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
            potentialRevenue: Number.parseFloat(potentialRevenue.toFixed(2)),
            revenuePercentage: Number.parseFloat(revenuePercentage),
          },
          topEvents: topEvents.map((event) => ({
            id: event.id,
            title: event.title,
            ticketsTotal: event.tickets_total,
            ticketsAvailable: event.tickets_available,
            ticketsSold: Number(event.tickets_sold),
            occupancyPercentage: Number.parseFloat(event.occupancy_percentage),
            price: event.price,
            revenue: Number.parseFloat((Number(event.tickets_sold) * event.price).toFixed(2)),
          })),
          lowOccupancyEvents: lowOccupancyEvents.map((event) => ({
            id: event.id,
            title: event.title,
            datetime: event.datetime,
            ticketsTotal: event.tickets_total,
            ticketsAvailable: event.tickets_available,
            ticketsSold: Number(event.tickets_sold),
            occupancyPercentage: Number.parseFloat(event.occupancy_percentage),
          })),
        },
      })
    } catch (error) {
      console.error('Error en estadisticas:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }
}
