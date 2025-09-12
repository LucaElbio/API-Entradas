# Script para probar la API de Usuarios
# Uso: .\test-api.ps1

$baseUrl = "http://localhost:3333"

Write-Host "=== PROBANDO API DE USUARIOS ===" -ForegroundColor Green

# Función para hacer requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $uri = "$baseUrl$Endpoint"
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 3
            Write-Host "Request: $Method $uri" -ForegroundColor Yellow
            Write-Host "Body: $jsonBody" -ForegroundColor Cyan
            
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Body $jsonBody -Headers $headers
        } else {
            Write-Host "Request: $Method $uri" -ForegroundColor Yellow
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
        
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 3 | Write-Host
        return $response
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        }
        return $null
    }
}

# 1. Probar ruta básica
Write-Host "`n1. PROBANDO RUTA BÁSICA" -ForegroundColor Magenta
Invoke-ApiRequest -Method "GET" -Endpoint "/"

# 2. Registrar un usuario
Write-Host "`n2. REGISTRANDO USUARIO" -ForegroundColor Magenta
$userRegistration = @{
    firstName = "Juan"
    lastName = "Pérez"
    email = "juan.perez@example.com"
    dni = "12345678"
    password = "Password123"
}
$registerResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $userRegistration

# 3. Intentar registrar usuario duplicado (debe fallar)
Write-Host "`n3. INTENTANDO REGISTRO DUPLICADO (debe fallar)" -ForegroundColor Magenta
Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $userRegistration

# 4. Login
Write-Host "`n4. INICIANDO SESIÓN" -ForegroundColor Magenta
$loginData = @{
    email = "juan.perez@example.com"
    password = "Password123"
}
$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $loginData

# 5. Obtener perfil (si el login fue exitoso)
if ($loginResponse -and $loginResponse.token) {
    Write-Host "`n5. OBTENIENDO PERFIL DE USUARIO" -ForegroundColor Magenta
    Invoke-ApiRequest -Method "GET" -Endpoint "/auth/me" -Token $loginResponse.token
    
    Write-Host "`n6. CERRANDO SESIÓN" -ForegroundColor Magenta
    Invoke-ApiRequest -Method "POST" -Endpoint "/auth/logout" -Token $loginResponse.token
}

# 6. Probar validaciones
Write-Host "`n7. PROBANDO VALIDACIONES (email inválido)" -ForegroundColor Magenta
$invalidUser = @{
    firstName = "Ana"
    lastName = "García"
    email = "email-invalido"
    dni = "87654321"
    password = "Password123"
}
Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $invalidUser

Write-Host "`n8. PROBANDO VALIDACIONES (contraseña débil)" -ForegroundColor Magenta
$weakPasswordUser = @{
    firstName = "Carlos"
    lastName = "López"
    email = "carlos@example.com"
    dni = "11223344"
    password = "123"
}
Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $weakPasswordUser

Write-Host "`n=== PRUEBAS COMPLETADAS ===" -ForegroundColor Green
