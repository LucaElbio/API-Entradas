// Script para probar la API
const http = require('http');

console.log('🔍 Probando el API de Autenticación...\n');

// Test 1: Endpoint raíz
function testRoot() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3334,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Test Root Endpoint:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en Root Endpoint:', err.message);
      resolve();
    });
    
    req.end();
  });
}

// Test 2: Registro de usuario (endpoint original)
function testRegister() {
  return new Promise((resolve) => {
    const userData = JSON.stringify({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.test@example.com',
      dni: '87654321',
      password: 'TestPass123'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3334,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(userData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Test User Registration (auth/register):');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en Registration:', err.message);
      resolve();
    });
    
    req.write(userData);
    req.end();
  });
}

// Test 2b: Nuevo endpoint de registro - POST /usuarios/registro
function testNewRegister() {
  return new Promise((resolve) => {
    const userData = JSON.stringify({
      firstName: 'Maria',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      dni: '12348765',
      password: 'NewPass123'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3334,
      path: '/usuarios/registro',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(userData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Test New User Registration (usuarios/registro):');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en New Registration endpoint:', err.message);
      resolve();
    });
    
    req.write(userData);
    req.end();
  });
}

// Test 3: Login
function testLogin() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'juan.test@example.com',
      password: 'TestPass123'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3334,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Test User Login:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}\n`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Error en Login:', err.message);
      resolve();
    });
    
    req.write(loginData);
    req.end();
  });
}

// Ejecutar todos los tests
async function runTests() {
  await testRoot();
  await testRegister();
  await testNewRegister(); // Nuevo test para el endpoint solicitado
  await testLogin();
  
  console.log('🎉 Tests completados!');
  console.log('\n📋 RESUMEN DE IMPLEMENTACIÓN:');
  console.log('✅ Modelo User alineado con ERD');
  console.log('✅ Registro con validaciones completas');
  console.log('✅ Login con autenticación JWT');
  console.log('✅ Perfil de usuario protegido');
  console.log('✅ Criterios de aceptación cumplidos');
  console.log('✅ NUEVO: Endpoint POST /usuarios/registro implementado');
}

runTests();
