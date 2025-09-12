# Script simple para probar la API
Write-Host "=== PROBANDO API DE USUARIOS ===" -ForegroundColor Green

# 1. Probar ruta básica
Write-Host "`n1. PROBANDO RUTA BÁSICA" -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3333/" -Method GET
    Write-Host "Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Registrar usuario
Write-Host "`n2. REGISTRANDO USUARIO" -ForegroundColor Magenta
$headers = @{ "Content-Type" = "application/json" }
$userData = @{
    firstName = "Juan"
    lastName = "Pérez"
    email = "juan.perez@example.com"
    dni = "12345678"
    password = "Password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3333/auth/register" -Method POST -Body $userData -Headers $headers
    Write-Host "Usuario registrado:" -ForegroundColor Green
    Write-Host ($registerResponse | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error en registro: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Login
Write-Host "`n3. INICIANDO SESIÓN" -ForegroundColor Magenta
$loginData = @{
    email = "juan.perez@example.com"
    password = "Password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3333/auth/login" -Method POST -Body $loginData -Headers $headers
    Write-Host "Login exitoso:" -ForegroundColor Green
    Write-Host ($loginResponse | ConvertTo-Json -Depth 3)
    
    # 4. Obtener perfil
    if ($loginResponse.token) {
        Write-Host "`n4. OBTENIENDO PERFIL" -ForegroundColor Magenta
        $authHeaders = @{ 
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $($loginResponse.token)"
        }
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:3333/auth/me" -Method GET -Headers $authHeaders
        Write-Host "Perfil obtenido:" -ForegroundColor Green
        Write-Host ($profileResponse | ConvertTo-Json -Depth 3)
    }
} catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PRUEBAS COMPLETADAS ===" -ForegroundColor Green
