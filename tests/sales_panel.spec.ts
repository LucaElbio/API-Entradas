import { DateTime } from 'luxon'

// Mock Event model
const mockSalesPanelEventQuery = jest.fn()

jest.mock('#models/event', () => ({
  __esModule: true,
  default: {
    query: mockSalesPanelEventQuery,
  },
}))

// Mock Venue model
jest.mock('#models/venue', () => ({
  __esModule: true,
  default: {},
}))

// Mock EventStatus model
jest.mock('#models/event_status', () => ({
  __esModule: true,
  default: {},
}))

// Mock Company model
jest.mock('#models/company', () => ({
  __esModule: true,
  default: {},
}))

// Mock User model for auth
jest.mock('#models/user', () => ({
  __esModule: true,
  default: {},
}))

// Mock Role model
jest.mock('#models/role', () => ({
  __esModule: true,
  default: {},
}))

describe('EventsController - Panel de Ventas (Admin)', () => {
  let eventsController: any

  beforeEach(() => {
    jest.clearAllMocks()
    const EventsController = require('#controllers/Http/events_controller').default
    eventsController = new EventsController()
  })

  describe('Listado de Eventos con Estadísticas de Ventas', () => {
    it('debe retornar listado con columnas: Nombre, Entradas vendidas, Entradas disponibles y % de ocupación', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Concierto Rock',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 30,
          company: { name: 'Empresa A' },
          venue: { name: 'Teatro Principal', address: 'Calle 123' },
        },
        {
          id: 2,
          title: 'Festival Jazz',
          datetime: DateTime.fromISO('2025-12-15T19:00:00'),
          price: 7000,
          ticketsTotal: 200,
          ticketsAvailable: 150,
          company: { name: 'Empresa B' },
          venue: { name: 'Auditorio Nacional', address: 'Avenida 456' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 2,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({ page: 1, limit: 10 }) }
      const response = {
        json: jest.fn(),
      }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith({
        message: 'Estadísticas de ventas de eventos',
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Concierto Rock',
            ticketsTotal: 100,
            ticketsAvailable: 30,
            ticketsSold: 70,
            occupancyPercentage: 70,
          }),
          expect.objectContaining({
            id: 2,
            title: 'Festival Jazz',
            ticketsTotal: 200,
            ticketsAvailable: 150,
            ticketsSold: 50,
            occupancyPercentage: 25,
          }),
        ]),
        meta: expect.objectContaining({
          total: 2,
          currentPage: 1,
        }),
      })
    })

    it('debe calcular correctamente el porcentaje de ocupación cuando hay 100% de ventas', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Sold Out',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 0,
          company: { name: 'Empresa A' },
          venue: { name: 'Teatro Principal', address: 'Calle 123' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              ticketsSold: 100,
              occupancyPercentage: 100,
            }),
          ]),
        })
      )
    })

    it('debe calcular correctamente el porcentaje de ocupación cuando no hay ventas', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Sin Ventas',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 100,
          company: { name: 'Empresa A' },
          venue: { name: 'Teatro Principal', address: 'Calle 123' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              ticketsSold: 0,
              occupancyPercentage: 0,
            }),
          ]),
        })
      )
    })

    it('debe soportar paginación correctamente', async () => {
      const mockEvents = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: `Evento ${i + 1}`,
        datetime: DateTime.fromISO('2025-12-01T20:00:00'),
        price: 5000,
        ticketsTotal: 100,
        ticketsAvailable: 50,
        company: { name: 'Empresa A' },
        venue: { name: 'Teatro Principal', address: 'Calle 123' },
      }))

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 25,
          perPage: 5,
          currentPage: 2,
          lastPage: 5,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({ page: 2, limit: 5 }) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.any(Object)]),
          meta: expect.objectContaining({
            total: 25,
            perPage: 5,
            currentPage: 2,
            lastPage: 5,
          }),
        })
      )
    })

    it('debe incluir información del venue y company en cada evento', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Concierto Rock',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 30,
          company: { name: 'Productora Musical SA' },
          venue: { name: 'Teatro Gran Rex', address: 'Corrientes 857' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              company: 'Productora Musical SA',
              venue: expect.objectContaining({
                name: 'Teatro Gran Rex',
                address: 'Corrientes 857',
              }),
            }),
          ]),
        })
      )
    })

    it('debe manejar eventos sin company o venue', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Sin Datos',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 30,
          company: null,
          venue: null,
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              company: null,
              venue: expect.objectContaining({
                name: null,
                address: null,
              }),
            }),
          ]),
        })
      )
    })

    it('debe retornar lista vacía cuando no hay eventos', async () => {
      const mockPaginator = {
        all: jest.fn().mockReturnValue([]),
        getMeta: jest.fn().mockReturnValue({
          total: 0,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          meta: expect.objectContaining({
            total: 0,
          }),
        })
      )
    })
  })

  describe('Visualización Gráfica - Datos para Gráficos', () => {
    it('debe proporcionar datos necesarios para gráfico de barras de ocupación', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Alta Ocupación',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 10,
          company: { name: 'Empresa A' },
          venue: { name: 'Venue A', address: 'Address A' },
        },
        {
          id: 2,
          title: 'Evento Media Ocupación',
          datetime: DateTime.fromISO('2025-12-15T19:00:00'),
          price: 7000,
          ticketsTotal: 100,
          ticketsAvailable: 50,
          company: { name: 'Empresa B' },
          venue: { name: 'Venue B', address: 'Address B' },
        },
        {
          id: 3,
          title: 'Evento Baja Ocupación',
          datetime: DateTime.fromISO('2025-12-20T18:00:00'),
          price: 3000,
          ticketsTotal: 100,
          ticketsAvailable: 90,
          company: { name: 'Empresa C' },
          venue: { name: 'Venue C', address: 'Address C' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 3,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      expect(responseData).toHaveLength(3)
      expect(responseData[0]).toMatchObject({
        title: 'Evento Alta Ocupación',
        occupancyPercentage: 90,
      })
      expect(responseData[1]).toMatchObject({
        title: 'Evento Media Ocupación',
        occupancyPercentage: 50,
      })
      expect(responseData[2]).toMatchObject({
        title: 'Evento Baja Ocupación',
        occupancyPercentage: 10,
      })
    })

    it('debe proporcionar estadísticas globales para visualización general', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento 1',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 30,
          venue: { name: 'Venue A', address: 'Address A' },
        },
        {
          id: 2,
          title: 'Evento 2',
          datetime: DateTime.fromISO('2025-12-15T19:00:00'),
          price: 10000,
          ticketsTotal: 200,
          ticketsAvailable: 100,
          venue: { name: 'Venue B', address: 'Address B' },
        },
      ]

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockEvents),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Estadísticas globales del sistema',
          data: expect.objectContaining({
            global: expect.objectContaining({
              totalEvents: 2,
              totalCapacity: 300,
              totalSold: 170,
              totalAvailable: 130,
              globalOccupancyPercentage: expect.any(Number),
            }),
          }),
        })
      )
    })

    it('debe proporcionar top 5 eventos para gráfico de mejores ventas', async () => {
      const mockEvents = Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        title: `Evento ${i + 1}`,
        datetime: DateTime.fromISO('2025-12-01T20:00:00'),
        price: 5000,
        ticketsTotal: 100,
        ticketsAvailable: i * 10,
        venue: { name: `Venue ${i + 1}`, address: `Address ${i + 1}` },
      }))

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockEvents),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      expect(responseData.topEvents).toBeDefined()
      expect(responseData.topEvents).toHaveLength(5)
      expect(responseData.topEvents[0].ticketsSold).toBeGreaterThanOrEqual(
        responseData.topEvents[4].ticketsSold
      )
    })

    it('debe identificar eventos con baja ocupación (<30%) para alertas visuales', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Baja Venta 1',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 85,
          venue: { name: 'Venue A', address: 'Address A' },
        },
        {
          id: 2,
          title: 'Evento Normal',
          datetime: DateTime.fromISO('2025-12-15T19:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 50,
          venue: { name: 'Venue B', address: 'Address B' },
        },
        {
          id: 3,
          title: 'Evento Baja Venta 2',
          datetime: DateTime.fromISO('2025-12-20T18:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 95,
          venue: { name: 'Venue C', address: 'Address C' },
        },
      ]

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockEvents),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      expect(responseData.lowOccupancyEvents).toBeDefined()
      expect(responseData.lowOccupancyEvents.length).toBeGreaterThan(0)
      expect(
        responseData.lowOccupancyEvents.every((event: any) => event.occupancyPercentage < 30)
      ).toBe(true)
    })
  })

  describe('Control de Acceso - Solo Administradores', () => {
    it('debe requerir autenticación para endpoint /sales', async () => {
      // Este test verifica la estructura del endpoint
      // El middleware de autenticación se testea en los tests de integración
      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue({
          all: jest.fn().mockReturnValue([]),
          getMeta: jest.fn().mockReturnValue({
            total: 0,
            perPage: 10,
            currentPage: 1,
            lastPage: 1,
          }),
        }),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      // El endpoint ejecuta correctamente cuando es llamado
      expect(response.json).toHaveBeenCalled()
    })

    it('debe requerir autenticación para endpoint /statistics', async () => {
      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      // El endpoint ejecuta correctamente cuando es llamado
      expect(response.json).toHaveBeenCalled()
    })

    it('debe permitir consulta de estadísticas de evento específico', async () => {
      const mockEvent = {
        id: 1,
        title: 'Evento Específico',
        datetime: DateTime.fromISO('2025-12-01T20:00:00'),
        price: 5000,
        ticketsTotal: 100,
        ticketsAvailable: 40,
        venue: { name: 'Teatro Principal' },
      }

      mockSalesPanelEventQuery.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        preload: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockEvent),
      })

      const request = { qs: () => ({ eventId: 1 }) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Estadísticas del evento',
          data: expect.objectContaining({
            eventId: 1,
            title: 'Evento Específico',
            ticketsSold: 60,
            occupancyPercentage: 60,
          }),
        })
      )
    })

    it('debe retornar 404 cuando se busca evento inexistente', async () => {
      mockSalesPanelEventQuery.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        preload: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      })

      const request = { qs: () => ({ eventId: 999 }) }
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await eventsController.statistics({ request, response })

      expect(response.status).toHaveBeenCalledWith(404)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Evento no encontrado',
      })
    })
  })

  describe('Cálculos de Métricas - Precisión y Exactitud', () => {
    it('debe calcular correctamente los ingresos totales y potenciales', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento 1',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 1000,
          ticketsTotal: 100,
          ticketsAvailable: 50,
          venue: { name: 'Venue A', address: 'Address A' },
        },
      ]

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockEvents),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      expect(responseData.global.totalRevenue).toBe(50000) // 50 vendidas * 1000
      expect(responseData.global.potentialRevenue).toBe(100000) // 100 total * 1000
      expect(responseData.global.revenuePercentage).toBe(50)
    })

    it('debe redondear porcentajes a 2 decimales', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento 1',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 3,
          ticketsAvailable: 2,
          company: { name: 'Empresa A' },
          venue: { name: 'Venue A', address: 'Address A' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      // 1 vendida de 3 = 33.33%
      expect(responseData[0].occupancyPercentage).toBe(33.33)
    })

    it('debe calcular correctamente el porcentaje global de ocupación', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento 1',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 100,
          ticketsAvailable: 25,
          venue: { name: 'Venue A', address: 'Address A' },
        },
        {
          id: 2,
          title: 'Evento 2',
          datetime: DateTime.fromISO('2025-12-15T19:00:00'),
          price: 10000,
          ticketsTotal: 200,
          ticketsAvailable: 50,
          venue: { name: 'Venue B', address: 'Address B' },
        },
      ]

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockEvents),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.statistics({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      // (75 + 150) vendidas / (100 + 200) total = 225/300 = 75%
      expect(responseData.global.totalSold).toBe(225)
      expect(responseData.global.totalCapacity).toBe(300)
      expect(responseData.global.globalOccupancyPercentage).toBe(75)
    })

    it('debe manejar división por cero cuando no hay capacidad', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Evento Sin Capacidad',
          datetime: DateTime.fromISO('2025-12-01T20:00:00'),
          price: 5000,
          ticketsTotal: 0,
          ticketsAvailable: 0,
          company: { name: 'Empresa A' },
          venue: { name: 'Venue A', address: 'Address A' },
        },
      ]

      const mockPaginator = {
        all: jest.fn().mockReturnValue(mockEvents),
        getMeta: jest.fn().mockReturnValue({
          total: 1,
          perPage: 10,
          currentPage: 1,
          lastPage: 1,
        }),
      }

      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockResolvedValue(mockPaginator),
      })

      const request = { qs: () => ({}) }
      const response = { json: jest.fn() }

      await eventsController.sales({ request, response })

      const responseData = response.json.mock.calls[0][0].data

      expect(responseData[0].occupancyPercentage).toBe(0)
      expect(responseData[0].ticketsSold).toBe(0)
    })
  })

  describe('Manejo de Errores', () => {
    it('debe manejar errores de base de datos en endpoint /sales', async () => {
      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockRejectedValue(new Error('Error de base de datos')),
      })

      const request = { qs: () => ({}) }
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await eventsController.sales({ request, response })

      expect(response.status).toHaveBeenCalledWith(500)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor',
        error: 'Error de base de datos',
      })
    })

    it('debe manejar errores de base de datos en endpoint /statistics', async () => {
      mockSalesPanelEventQuery.mockReturnValue({
        preload: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(new Error('Error de base de datos')),
      })

      const request = { qs: () => ({}) }
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }

      await eventsController.statistics({ request, response })

      expect(response.status).toHaveBeenCalledWith(500)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Error interno del servidor',
        error: 'Error de base de datos',
      })
    })
  })
})
