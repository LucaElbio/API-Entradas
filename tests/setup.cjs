// Configuración global para Jest en CJS para evitar problemas ESM
require('reflect-metadata')

afterEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})
