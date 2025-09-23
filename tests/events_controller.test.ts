import EventsController from '#controllers/Http/events_controller'
import { DateTime } from 'luxon'

// Mock del modelo Event y su API de query encadenable
const mockWhere = jest.fn()
const mockWhereRaw = jest.fn()
const mockWhereHas = jest.fn()
const mockOrderBy = jest.fn()
const mockPreload = jest.fn()
const mockFirst = jest.fn()
const mockPaginate = jest.fn()

const mockQueryBuilder = {
  where: (...args: any[]) => {
    mockWhere(...args)
    return mockQueryBuilder
  },
  whereRaw: (...args: any[]) => {
    mockWhereRaw(...args)
    return mockQueryBuilder
  },
  whereHas: (...args: any[]) => {
    mockWhereHas(...args)
    return mockQueryBuilder
  },
  orderBy: (...args: any[]) => {
    mockOrderBy(...args)
    return mockQueryBuilder
  },
  preload: (...args: any[]) => {
    mockPreload(...args)
    return mockQueryBuilder
  },
  first: (...args: any[]) => mockFirst(...args),
  paginate: (...args: any[]) => mockPaginate(...args),
}

jest.mock('#models/event', () => ({
  __esModule: true,
  default: {
    query: () => mockQueryBuilder,
  },
}))

function makeCtx({ params = {} as any, qs = {} as any } = {}) {
  const req = {
    qs: () => qs,
  } as any

  const resState: { status?: number; body?: any } = {}
  const res = {
    status: (code: number) => ({
      json: (payload: any) => {
        resState.status = code
        resState.body = payload
        return payload
      },
    }),
    json: (payload: any) => {
      resState.status = 200
      resState.body = payload
      return payload
    },
  } as any

  return { ctx: { request: req, response: res, params } as any, resState }
}

describe('EventsController - show', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Evento encontrado -> retorna datos correctos', async () => {
    const controller = new EventsController()
    const { ctx, resState } = makeCtx({ params: { id: 5 } })

    const fakeEvent = {
      id: 5,
      title: 'Concierto Rock',
      description: 'Bandas en vivo',
      datetime: DateTime.fromISO('2025-12-31T21:00:00.000Z'),
      price: 15000,
      ticketsAvailable: 250,
      ticketsTotal: 500,
      venue: { name: 'Estadio Central', address: 'Av. Falsa 123', capacity: 20000 },
      company: { name: 'LiveNation' },
    }

    mockFirst.mockResolvedValueOnce(fakeEvent)

    await controller.show(ctx)

    expect(mockWhere).toHaveBeenCalledWith('id', 5)
    expect(mockPreload).toHaveBeenCalledWith('venue')
    expect(resState.status).toBe(200)
    expect(resState.body?.message).toBe('Detalle del evento')

    // Campos clave según criterios: descripción, fecha/hora, lugar, disponibilidad y precio
    expect(resState.body?.data).toMatchObject({
      id: 5,
      title: 'Concierto Rock',
      description: 'Bandas en vivo',
      price: 15000,
      ticketsAvailable: 250,
      venue: { name: 'Estadio Central', address: 'Av. Falsa 123' },
      company: { name: 'LiveNation' },
    })

    // fecha/hora: el controlador devuelve `datetime` (DateTime). Validamos presencia
    expect(resState.body?.data?.datetime).toBeTruthy()
  })

  test('Evento inexistente -> retorna 404', async () => {
    const controller = new EventsController()
    const { ctx, resState } = makeCtx({ params: { id: 999 } })

    mockFirst.mockResolvedValueOnce(null)

    await controller.show(ctx)

    expect(resState.status).toBe(404)
    expect(resState.body?.message).toBe('Evento no encontrado')
  })
})

describe('EventsController - index (catálogo con filtros)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Lista con filtros -> retorna datos correctos y aplica filtros', async () => {
    const controller = new EventsController()
    const date = '2025-12-31'
    const location = 'Central'
    const type = 'Rock'
    const page = 2
    const limit = 5

    const { ctx, resState } = makeCtx({ qs: { date, location, type, page, limit } })

    const items = [
      {
        id: 1,
        title: 'Concierto Rock',
        description: 'Rock en vivo',
        datetime: DateTime.fromISO('2025-12-31T21:00:00.000Z'),
        price: 10000,
        ticketsAvailable: 100,
        venue: { name: 'Estadio Central', address: 'Av. Falsa 123' },
        company: { name: 'Acme' },
      },
      {
        id: 2,
        title: 'Rock Alternativo',
        description: 'Bandas indie',
        datetime: DateTime.fromISO('2026-01-10T21:00:00.000Z'),
        price: 12000,
        ticketsAvailable: 50,
        venue: { name: 'Teatro Central', address: 'Calle Verdadera 456' },
        company: { name: 'Acme' },
      },
    ]

    // Estructura de paginación simulada
    mockPaginate.mockResolvedValueOnce({
      total: items.length,
      serialize: () => ({ data: items }),
      getMeta: () => ({ total: items.length, per_page: limit, current_page: page }),
    })

  await controller.index(ctx)

    // Verifica que se aplicaron filtros y orden
    expect(mockWhereRaw).toHaveBeenCalledWith('DATE(datetime) = ?', [date])
    expect(mockWhereHas).toHaveBeenCalled() // no podemos inspeccionar la callback internamente
    expect(mockWhere).toHaveBeenCalledWith('title', 'like', `%${type}%`)
    expect(mockWhere).toHaveBeenCalledWith('tickets_available', '>', 0)
    expect(mockOrderBy).toHaveBeenCalledWith('datetime', 'asc')
    expect(mockPaginate).toHaveBeenCalledWith(page, limit)

    // Respuesta correcta
    expect(resState.status).toBe(200)
    expect(resState.body?.message).toBe('Eventos encontrados')
    expect(Array.isArray(resState.body?.data)).toBe(true)
    expect(resState.body?.data?.length).toBe(2)
    // Campos mínimos según criterios: nombre (title), fecha (datetime), lugar (venue), precio
    expect(resState.body?.data?.[0]).toMatchObject({
      title: expect.any(String),
      datetime: expect.anything(),
      price: expect.any(Number),
      venue: expect.objectContaining({ name: expect.any(String), address: expect.any(String) }),
    })
  })

  test('Sin resultados -> muestra mensaje 404', async () => {
    const controller = new EventsController()
    const { ctx, resState } = makeCtx({ qs: {} })

    mockPaginate.mockResolvedValueOnce({
      total: 0,
      serialize: () => ({ data: [] }),
      getMeta: () => ({ total: 0, per_page: 10, current_page: 1 }),
    })

  await controller.index(ctx)

    expect(resState.status).toBe(404)
    expect(resState.body?.message).toBe('No se encontraron eventos con los filtros aplicados')
    expect(Array.isArray(resState.body?.data)).toBe(true)
    expect(resState.body?.data?.length).toBe(0)
  })
})
