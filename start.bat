@echo off
REM LiquiVerde - Script de Inicio para Windows
REM Inicia la aplicación completa usando Docker Compose

echo.
echo ================================
echo  LiquiVerde - Iniciando aplicacion
echo ================================
echo.

REM Verificar si Docker esta instalado
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker no esta instalado
    echo Por favor instala Docker desde: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

echo [OK] Docker detectado
echo.

REM Verificar Docker Compose
docker compose version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set COMPOSE_CMD=docker compose
) else (
    where docker-compose >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Docker Compose no esta disponible
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker-compose
)

REM Detener contenedores previos
echo Limpiando contenedores previos...
%COMPOSE_CMD% down >nul 2>nul

REM Construir e iniciar servicios
echo.
echo Construyendo servicios...
%COMPOSE_CMD% build

echo.
echo Iniciando servicios...
%COMPOSE_CMD% up -d

echo.
echo Esperando que los servicios esten listos...
timeout /t 5 /nobreak >nul

REM Mostrar estado
echo.
echo Estado de los servicios:
%COMPOSE_CMD% ps

echo.
echo ================================
echo  Aplicacion iniciada!
echo ================================
echo.
echo Accesos:
echo   Frontend:        http://localhost
echo   Backend API:     http://localhost:8000
echo   API Docs:        http://localhost:8000/docs
echo.
echo Para ver logs: %COMPOSE_CMD% logs -f
echo Para detener:  stop.bat
echo.
pause
