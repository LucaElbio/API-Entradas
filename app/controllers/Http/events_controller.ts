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
}
