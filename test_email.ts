import MailService from './app/services/mail_service.js'
import { DateTime } from 'luxon'

async function testEmail() {
  console.log('🧪 Testing email service...\n')

  const mailService = new MailService()

  // Test SMTP connection
  console.log('1️⃣ Testing SMTP connection...')
  const connected = await mailService.testConnection()

  if (!connected) {
    console.log('❌ SMTP connection failed. Check your .env configuration.')
    return
  }

  console.log('\n2️⃣ Sending test email...')

  // Send test email
  const success = await mailService.sendPurchaseConfirmation({
    user: {
      firstName: 'Test',
      lastName: 'User',
      email: 'nazzettagonzalo@gmail.com', // Sending to the same email
    },
    event: {
      title: 'Evento de Prueba',
      description: 'Este es un evento de prueba',
      datetime: DateTime.now().plus({ days: 7 }),
      venue: {
        name: 'Venue Test',
        address: 'Calle Falsa 123',
      },
      price: 1000,
    },
    tickets: [
      {
        id: 999,
        qrCode: 'TEST-QR-CODE-123|999|1',
        qrImageUrl:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    ],
    payment: {
      amount: 1000,
      externalRef: 'TEST-PAY-123',
    },
    reservation: {
      id: 999,
      quantity: 1,
    },
  })

  if (success) {
    console.log('\n✅ Test email sent successfully!')
    console.log('📧 Check your inbox: nazzettagonzalo@gmail.com')
  } else {
    console.log('\n❌ Failed to send test email')
  }
}

testEmail()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
