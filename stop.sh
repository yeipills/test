#!/bin/bash

# LiquiVerde - Script de Detención
# Detiene todos los servicios de la aplicación

set -e

echo "🌿 LiquiVerde - Deteniendo aplicación..."
echo ""

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

# Detener servicios
echo "🛑 Deteniendo servicios..."
$COMPOSE_CMD down

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Aplicación detenida exitosamente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Para iniciar nuevamente: ./start.sh"
echo ""
