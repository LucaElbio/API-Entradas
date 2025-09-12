const axios = require('axios');

const baseURL = 'http://localhost:3334';

async function testLogin() {
  try {
    console.log('=== Test del endpoint POST /usuarios/login ===\n');

    // Test 1: Login con credenciales válidas
    console.log('1. Probando login con credenciales válidas...');
    try {
      const response = await axios.post(`${baseURL}/usuarios/login`, {
        email: 'admin@empresa.com',
        password: 'Admin123'
      });

      console.log('✅ Login exitoso');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('Token recibido:', response.data.token ? '✅ Sí' : '❌ No');
    } catch (error) {
      console.log('❌ Error en login válido:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 2: Login con credenciales inválidas
    console.log('2. Probando login con credenciales inválidas...');
    try {
      const response = await axios.post(`${baseURL}/usuarios/login`, {
        email: 'admin@empresa.com',
        password: 'ContraseñaIncorrecta'
      });

      console.log('❌ No debería permitir login con contraseña incorrecta');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctamente rechazó credenciales inválidas');
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    console.log('\n---\n');

    // Test 3: Login con email inexistente
    console.log('3. Probando login con email inexistente...');
    try {
      const response = await axios.post(`${baseURL}/usuarios/login`, {
        email: 'noexiste@ejemplo.com',
        password: 'Admin123'
      });

      console.log('❌ No debería permitir login con email inexistente');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctamente rechazó email inexistente');
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

    console.log('\n---\n');

    // Test 4: Login con datos incompletos
    console.log('4. Probando login con datos incompletos...');
    try {
      const response = await axios.post(`${baseURL}/usuarios/login`, {
        email: 'admin@empresa.com'
        // falta password
      });

      console.log('❌ No debería permitir login sin contraseña');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctamente rechazó datos incompletos');
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error inesperado:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

// Ejecutar los tests
testLogin();
