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

// Importar el controlador después de definir los mocks
const EventsController = require('#controllers/Http/events_controller').default

// Helper para context
function createHttpContext({ params = {} as any } = {}) {
  const state: any = { status: 0, body: null }
  const response = {
    json: (data: any) => {
      state.status = state.status || 200
      state.body = data
      return { statusCode: state.status, body: data }
    },
    status: (code: number) => {
      state.status = code
      return {
        json: (data: any) => {
          state.body = data
          return { statusCode: code, body: data }
        },
      }
    },
  }
  return { params, response, state }
}

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
