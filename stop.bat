@echo off
REM LiquiVerde - Script de Detencion para Windows
REM Detiene todos los servicios de la aplicacion

echo.
echo ================================
echo  LiquiVerde - Deteniendo aplicacion
echo ================================
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

REM Detener servicios
echo Deteniendo servicios...
%COMPOSE_CMD% down

echo.
echo ================================
echo  Aplicacion detenida
echo ================================
echo.
echo Para iniciar nuevamente: start.bat
echo.
pause
