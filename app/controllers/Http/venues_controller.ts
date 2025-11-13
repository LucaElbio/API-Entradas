import type { HttpContext } from '@adonisjs/core/http'
import Venue from '../../models/venue.js'
import Event from '../../models/event.js'

export default class VenuesController {
  /**
   * GET /api/venues
   */
  public async index({ response }: HttpContext) {
    try {
      const venues = await Venue.query().orderBy('name', 'asc')
      return response.json({
        message: 'Lugares obtenidos exitosamente',
        data: venues,
      })
    } catch (error) {
      console.error('Error en index venues:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * GET /api/venues/:id
   */
  public async show({ params, response }: HttpContext) {
    try {
      const venue = await Venue.query().where('id', params.id).preload('company').first()
      if (!venue) {
        return response.status(404).json({ message: 'Lugar no encontrado' })
      }
      return response.json({ message: 'Detalle del lugar', data: venue })
    } catch (error) {
      console.error('Error en show venue:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * POST /api/venues
   */
  public async create({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const { name, address, capacity } = request.only(['name', 'address', 'capacity'])

      if (!name || !address || !capacity) {
        return response.status(400).json({
          message: 'Todos los campos son obligatorios',
        })
      }

      const capacityNumber = Number(capacity)
      if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
        return response.status(400).json({
          message: 'La capacidad debe ser un número positivo',
        })
      }

      const venue = await Venue.create({
        name,
        address,
        capacity: capacityNumber,
        companyId: user.companyId,
      })

      return response.status(201).json({
        message: 'Lugar creado exitosamente',
        data: venue,
      })
    } catch (error) {
      console.error('Error en create venue:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * PUT /api/venues/:id
   */
  public async update({ auth, params, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const { name, address, capacity } = request.only(['name', 'address', 'capacity'])
      const venue = await Venue.find(params.id)

      if (!venue) {
        return response.status(404).json({ message: 'Lugar no encontrado' })
      }

      await user.load('role')
      if (user.role.code !== 'ADMIN' && venue.companyId !== user.companyId) {
        return response.status(403).json({
          message: 'No tiene permisos para editar este lugar',
        })
      }

      if (capacity !== undefined) {
        const capacityNumber = Number(capacity)
        if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
          return response.status(400).json({
            message: 'La capacidad debe ser un número positivo',
          })
        }
        venue.capacity = capacityNumber
      }

      if (name) venue.name = name
      if (address) venue.address = address
      await venue.save()

      return response.json({ message: 'Lugar actualizado exitosamente', data: venue })
    } catch (error) {
      console.error('Error en update venue:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }

  /**
   * DELETE /api/venues/:id
   */
  public async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const venue = await Venue.find(params.id)

      if (!venue) {
        return response.status(404).json({ message: 'Lugar no encontrado' })
      }

      await user.load('role')
      if (user.role.code !== 'ADMIN' && venue.companyId !== user.companyId) {
        return response.status(403).json({
          message: 'No tiene permisos para eliminar este lugar',
        })
      }

      // Verificar que no tenga eventos asociados
      const eventsCount = await Event.query().where('venue_id', venue.id).count('* as total')
      const totalEvents = Number(eventsCount[0]?.$extras?.total || 0)

      if (totalEvents > 0) {
        return response.status(400).json({
          message: 'No se puede eliminar un lugar que tiene eventos asociados',
          eventsCount: totalEvents,
        })
      }

      await venue.delete()
      return response.json({ message: 'Lugar eliminado exitosamente' })
    } catch (error) {
      console.error('Error en destroy venue:', error)
      return response.status(500).json({
        message: 'Error interno del servidor',
        error: error.message,
      })
    }
  }
}
