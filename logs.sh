#!/bin/bash

# LiquiVerde - Ver Logs
# Muestra logs de los servicios en Docker

set -e

# Verificar si Docker Compose está disponible
if ! docker compose version &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Error: Docker Compose no está disponible"
        exit 1
    fi
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo "📊 Logs de LiquiVerde"
echo "Presiona Ctrl+C para salir"
echo ""

# Si se pasa un argumento, mostrar logs de ese servicio específico
if [ $# -eq 1 ]; then
    $COMPOSE_CMD logs -f $1
else
    # Mostrar logs de todos los servicios
    $COMPOSE_CMD logs -f
fi
