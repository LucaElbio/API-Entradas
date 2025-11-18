// Mocks del modelo Event
const mockEventQuery = {
  where: jest.fn().mockReturnThis(),
  preload: jest.fn().mockReturnThis(),
  first: jest.fn(),
}

jest.mock('#models/event', () => ({
  __esModule: true,
  default: {
    query: () => mockEventQuery,
  },
}))

jest.mock('#models/event_status', () => ({
  __esModule: true,
  default: {},
}))

jest.mock('#models/venue', () => ({
  __esModule: true,
  default: {},
}))

// Importar el controlador después de definir los mocks
const EventsController = require('#controllers/Http/events_controller').default

// Importar helper compartido
import { createHttpContext } from './helpers/http_context_helper'

describe('EventsController - Detalle de evento (show)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Evento encontrado → retorna datos correctos', async () => {
    const controller = new EventsController()

    const event = {
      id: 5,
      title: 'Concierto Rock',
      description: 'Banda en vivo',
      datetime: new Date('2025-10-10T20:00:00Z'),
      price: 15000,
      ticketsAvailable: 100,
      ticketsTotal: 200,
      venue: { name: 'Teatro Central', address: 'Calle 123', capacity: 500 },
      company: { name: 'Productora SA' },
    }

    mockEventQuery.first.mockResolvedValueOnce(event)

    const ctx = createHttpContext({ params: { id: 5 } })
    const res = await controller.show(ctx as any)

    expect(mockEventQuery.where).toHaveBeenCalledWith('id', 5)
    expect(mockEventQuery.preload).toHaveBeenCalledWith('venue')
    expect(mockEventQuery.preload).toHaveBeenCalledWith('company')
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      message: 'Detalle del evento',
      data: {
        id: 5,
        title: 'Concierto Rock',
        description: 'Banda en vivo',
        price: 15000,
        ticketsAvailable: 100,
        ticketsTotal: 200,
        venue: expect.objectContaining({ name: 'Teatro Central', address: 'Calle 123' }),
        company: expect.objectContaining({ name: 'Productora SA' }),
      },
    })
  })

  it('Evento inexistente → retorna error 404', async () => {
    const controller = new EventsController()

    mockEventQuery.first.mockResolvedValueOnce(null)

    const ctx = createHttpContext({ params: { id: 999 } })
    const res = await controller.show(ctx as any)

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({ message: 'Evento no encontrado' })
  })
})
