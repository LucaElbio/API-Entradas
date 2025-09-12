// Script de pruebas usando Node.js nativo
const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 3333;

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Iniciando pruebas de API...\n');

    try {
        // 1. Probar ruta básica
        console.log('1. Probando ruta básica...');
        const homeResponse = await makeRequest('GET', '/');
        console.log(`   Status: ${homeResponse.status}`);
        console.log(`   Response:`, homeResponse.data);
        console.log('');

        // 2. Registrar usuario
        console.log('2. Registrando usuario...');
        const userData = {
            firstName: "Juan",
            lastName: "Pérez",
            email: "juan.nodetest@example.com",
            dni: "87654321",
            password: "Password123"
        };
        
        const registerResponse = await makeRequest('POST', '/auth/register', userData);
        console.log(`   Status: ${registerResponse.status}`);
        console.log(`   Response:`, JSON.stringify(registerResponse.data, null, 2));
        console.log('');

        // 3. Login
        console.log('3. Iniciando sesión...');
        const loginData = {
            email: "juan.nodetest@example.com",
            password: "Password123"
        };
        
        const loginResponse = await makeRequest('POST', '/auth/login', loginData);
        console.log(`   Status: ${loginResponse.status}`);
        console.log(`   Response:`, JSON.stringify(loginResponse.data, null, 2));
        
        // Si el login fue exitoso, probar rutas protegidas
        if (loginResponse.status === 200 && loginResponse.data.token) {
            const token = loginResponse.data.token;
            console.log('\n4. Obteniendo perfil de usuario...');
            
            // Aquí necesitaríamos implementar requests con headers de autorización
            // Por simplicidad, mostramos el token obtenido
            console.log(`   Token obtenido: ${token.substring(0, 30)}...`);
        }

        console.log('\n✅ Pruebas completadas');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
}

runTests();
