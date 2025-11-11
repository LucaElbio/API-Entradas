import type { HttpContext } from '@adonisjs/core/http'
import Event from '../../models/event.js'

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
   * GET /api/admin/events/sales
   * Endpoint para listar todos los eventos con entradas vendidas y disponibles
   * Acceso: Solo administradores
   */
  public async sales({ request, response }: HttpContext) {
    try {
      const { page = 1, limit = 10, sortBy = 'datetime', order = 'asc' } = request.qs()

      const pageNumber = Number(page) > 0 ? Number(page) : 1
      const limitNumber = Number(limit) > 0 ? Number(limit) : 10
      const orderDirection = String(order).toLowerCase() === 'desc' ? 'desc' : 'asc'

      const sortableColumns: Record<string, string> = {
        datetime: 'datetime',
        price: 'price',
        ticketsTotal: 'tickets_total',
        ticketsAvailable: 'tickets_available',
        title: 'title',
      }

      const sortColumn = sortableColumns[String(sortBy)] ?? 'datetime'

      const paginator = await Event.query()
        .preload('company', (companyQuery) => companyQuery.select('id', 'name'))
        .preload('venue', (venueQuery) => venueQuery.select('id', 'name', 'address'))
        .orderBy(sortColumn, orderDirection)
        .paginate(pageNumber, limitNumber)

      const events = paginator.all()

      const eventsWithStats = events.map((event) => {
        const ticketsSold = event.ticketsTotal - event.ticketsAvailable
        const occupancyPercentage =
          event.ticketsTotal > 0
            ? Number.parseFloat(((ticketsSold / event.ticketsTotal) * 100).toFixed(2))
            : 0

        const datetime =
          typeof event.datetime?.toISO === 'function'
            ? event.datetime.toISO()
            : (event.datetime?.toString() ?? null)

        return {
          id: event.id,
          title: event.title,
          datetime,
          price: event.price,
          ticketsTotal: event.ticketsTotal,
          ticketsAvailable: event.ticketsAvailable,
          ticketsSold,
          occupancyPercentage,
          company: event.company?.name ?? null,
          venue: {
            name: event.venue?.name ?? null,
            address: event.venue?.address ?? null,
          },
        }
      })

      const meta = paginator.getMeta()

      return response.json({
        message: 'Estadísticas de ventas de eventos',
        data: eventsWithStats,
        meta: {
          total: Number(meta.total ?? 0),
          perPage: Number(meta.perPage ?? limitNumber),
          currentPage: Number(meta.currentPage ?? pageNumber),
          lastPage: Number(meta.lastPage ?? Math.ceil((meta.total ?? 0) / limitNumber)),
        },
      })
    } catch (error) {
      console.error('Error in sales:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/admin/events/statistics
   * Endpoint para obtener métricas adicionales (% ocupación, ingresos totales)
   * Acceso: Solo administradores
   */
  public async statistics({ request, response }: HttpContext) {
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
          event.ticketsTotal > 0
            ? Number.parseFloat(((ticketsSold / event.ticketsTotal) * 100).toFixed(2))
            : 0
        const totalRevenue = Number.parseFloat((ticketsSold * event.price).toFixed(2))
        const potentialRevenue = Number.parseFloat((event.ticketsTotal * event.price).toFixed(2))
        const revenuePercentage =
          potentialRevenue > 0
            ? Number.parseFloat(((totalRevenue / potentialRevenue) * 100).toFixed(2))
            : 0

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
            occupancyPercentage,
            price: event.price,
            totalRevenue,
            potentialRevenue,
            revenuePercentage,
          },
        })
      }

      const events = await Event.query()
        .preload('venue', (venueQuery) => venueQuery.select('id', 'name', 'address'))
        .orderBy('datetime', 'asc')

      const eventsStats = events.map((event) => {
        const ticketsSold = event.ticketsTotal - event.ticketsAvailable
        const occupancyPercentage =
          event.ticketsTotal > 0
            ? Number.parseFloat(((ticketsSold / event.ticketsTotal) * 100).toFixed(2))
            : 0
        const totalRevenue = Number.parseFloat((ticketsSold * event.price).toFixed(2))
        const potentialRevenue = Number.parseFloat((event.ticketsTotal * event.price).toFixed(2))
        const eventDatetime =
          typeof event.datetime?.toISO === 'function'
            ? event.datetime.toISO()
            : (event.datetime?.toString() ?? null)

        return {
          id: event.id,
          title: event.title,
          datetime: eventDatetime,
          ticketsTotal: event.ticketsTotal,
          ticketsAvailable: event.ticketsAvailable,
          ticketsSold,
          occupancyPercentage,
          price: event.price,
          totalRevenue,
          potentialRevenue,
        }
      })

      const totalEvents = eventsStats.length
      const totalCapacity = eventsStats.reduce((acc, event) => acc + event.ticketsTotal, 0)
      const totalAvailable = eventsStats.reduce((acc, event) => acc + event.ticketsAvailable, 0)
      const totalSold = eventsStats.reduce((acc, event) => acc + event.ticketsSold, 0)
      const totalRevenue = Number.parseFloat(
        eventsStats.reduce((acc, event) => acc + event.totalRevenue, 0).toFixed(2)
      )
      const potentialRevenue = Number.parseFloat(
        eventsStats.reduce((acc, event) => acc + event.potentialRevenue, 0).toFixed(2)
      )

      const globalOccupancyPercentage =
        totalCapacity > 0 ? Number.parseFloat(((totalSold / totalCapacity) * 100).toFixed(2)) : 0

      const revenuePercentage =
        potentialRevenue > 0
          ? Number.parseFloat(((totalRevenue / potentialRevenue) * 100).toFixed(2))
          : 0

      const topEvents = [...eventsStats]
        .sort((a, b) => b.ticketsSold - a.ticketsSold)
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          title: event.title,
          ticketsTotal: event.ticketsTotal,
          ticketsAvailable: event.ticketsAvailable,
          ticketsSold: event.ticketsSold,
          occupancyPercentage: event.occupancyPercentage,
          price: event.price,
          revenue: Number.parseFloat((event.ticketsSold * event.price).toFixed(2)),
        }))

      const lowOccupancyEvents = eventsStats
        .filter((event) => event.ticketsTotal > 0 && event.occupancyPercentage < 30)
        .sort((a, b) => a.occupancyPercentage - b.occupancyPercentage)
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          title: event.title,
          datetime: event.datetime,
          ticketsTotal: event.ticketsTotal,
          ticketsAvailable: event.ticketsAvailable,
          ticketsSold: event.ticketsSold,
          occupancyPercentage: event.occupancyPercentage,
        }))

      return response.json({
        message: 'Estadísticas globales del sistema',
        data: {
          global: {
            totalEvents,
            totalCapacity,
            totalAvailable,
            totalSold,
            globalOccupancyPercentage,
            totalRevenue,
            potentialRevenue,
            revenuePercentage,
          },
          topEvents,
          lowOccupancyEvents,
        },
      })
    } catch (error) {
      console.error('Error in statistics:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }
}
