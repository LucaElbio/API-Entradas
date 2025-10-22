/**
 * Mock de la librería qrcode para tests
 */
export default {
  toDataURL: async (data: string, options?: any): Promise<string> => {
    // Simular generación de QR en base64
    return `data:image/png;base64,MOCK_QR_IMAGE_FOR_${data.substring(0, 20)}`
  },
}
