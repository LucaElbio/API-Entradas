/**
 * Mock de la librería nodemailer para tests
 */

export const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
export const mockVerify = jest.fn().mockResolvedValue(true)

const mockTransporter = {
  sendMail: mockSendMail,
  verify: mockVerify,
}

export default {
  createTransport: jest.fn(() => mockTransporter),
}

export const createTransport = jest.fn(() => mockTransporter)
