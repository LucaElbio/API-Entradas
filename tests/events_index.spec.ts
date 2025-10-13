// Mock del query builder para Event (index)
const venueWhereCallsIndex: any[] = []
const mockEventQueryIndex = {
  whereRaw: jest.fn().mockReturnThis(),
  whereHas: jest.fn(function (_rel: string, cb: Function) {
    const venueQuery = {
      where: jest.fn(function (...args: any[]) {
        venueWhereCallsIndex.push(['where', ...args])
        return this
      }),
      orWhere: jest.fn(function (...args: any[]) {
        venueWhereCallsIndex.push(['orWhere', ...args])
        return this
      }),
    }
    cb(venueQuery)
    return this
  }),
  where: jest.fn().mockReturnThis(),
  preload: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  paginate: jest.fn(),
}

jest.mock('#models/event', () => ({
  __esModule: true,
  default: {
    query: () => mockEventQueryIndex,
  },
}))

const EventsControllerIndex = require('#controllers/Http/events_controller').default

function createHttpContextIndex({ qs = {} as any } = {}) {
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
  const request = {
    qs: () => ({ ...qs }),
  }
  return { request, response, state }
}

describe('EventsController - Catálogo con filtros (index)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    venueWhereCallsIndex.length = 0
  })

  it('Devuelve lista filtrada por fecha, ubicación y tipo', async () => {
    const controller = new EventsControllerIndex()

    const sample = [
      {
        id: 1,
        title: 'Festival Indie',
        description: 'Música indie',
        datetime: new Date('2025-05-01T18:00:00Z'),
        price: 12000,
        ticketsAvailable: 50,
        venue: { name: 'Anfiteatro', address: 'Ciudad' },
      },
    ]

    const paginatorMock = {
      total: sample.length,
      getMeta: () => ({ total: sample.length, perPage: 10, currentPage: 1 }),
      serialize: () => ({ data: sample }),
    }

    mockEventQueryIndex.paginate.mockResolvedValueOnce(paginatorMock)

    const qs = { date: '2025-05-01', location: 'Ciudad', type: 'Indie', page: 1, limit: 10 }
    const ctx = createHttpContextIndex({ qs })
    const res = await controller.index(ctx as any)

    expect(mockEventQueryIndex.preload).toHaveBeenCalledWith('venue')
    expect(mockEventQueryIndex.preload).toHaveBeenCalledWith('company')
    expect(mockEventQueryIndex.whereRaw).toHaveBeenCalledWith('DATE(datetime) = ?', [qs.date])
    expect(mockEventQueryIndex.where).toHaveBeenCalledWith('title', 'like', `%${qs.type}%`)
    expect(mockEventQueryIndex.where).toHaveBeenCalledWith('tickets_available', '>', 0)
    expect(mockEventQueryIndex.orderBy).toHaveBeenCalledWith('datetime', 'asc')
    expect(mockEventQueryIndex.paginate).toHaveBeenCalledWith(1, 10)

    // Verificar filtros de ubicación aplicados dentro de whereHas
    expect(venueWhereCallsIndex).toEqual([
      ['where', 'address', 'like', `%${qs.location}%`],
      ['orWhere', 'name', 'like', `%${qs.location}%`],
    ])

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      message: 'Eventos encontrados',
      data: expect.arrayContaining([
        expect.objectContaining({ title: 'Festival Indie', price: 12000 }),
      ]),
      meta: expect.objectContaining({ total: 1 }),
    })
  })

  it('Sin resultados → responde 404 con mensaje y lista vacía', async () => {
    const controller = new EventsControllerIndex()

    const paginatorEmpty = {
      total: 0,
      getMeta: () => ({ total: 0, perPage: 10, currentPage: 1 }),
      serialize: () => ({ data: [] }),
    }

    mockEventQueryIndex.paginate.mockResolvedValueOnce(paginatorEmpty)

    const ctx = createHttpContextIndex({ qs: { date: '2030-01-01' } })
    const res = await controller.index(ctx as any)

    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      message: 'No se encontraron eventos con los filtros aplicados',
      data: [],
      meta: expect.any(Object),
    })
  })
})
