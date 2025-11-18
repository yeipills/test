#!/bin/bash

# LiquiVerde - Script de Inicio
# Inicia la aplicación completa usando Docker Compose

set -e

echo "🌿 LiquiVerde - Iniciando aplicación..."
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "Por favor instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

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

echo "✓ Docker detectado"
echo ""

# Detener contenedores previos si existen
echo "🔍 Limpiando contenedores previos..."
$COMPOSE_CMD down 2>/dev/null || true

# Construir e iniciar servicios
echo ""
echo "🏗️  Construyendo servicios..."
$COMPOSE_CMD build

echo ""
echo "🚀 Iniciando servicios..."
$COMPOSE_CMD up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 5

# Verificar estado de los servicios
echo ""
echo "📊 Estado de los servicios:"
$COMPOSE_CMD ps

# Verificar health del backend
echo ""
echo "🔍 Verificando salud del backend..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend está listo!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend tardó más de lo esperado, pero puede estar iniciando..."
    fi
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡Aplicación iniciada exitosamente!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Accesos:"
echo "   Frontend:        http://localhost"
echo "   Backend API:     http://localhost:8000"
echo "   API Docs:        http://localhost:8000/docs"
echo ""
echo "🗄️  Servicios de datos:"
echo "   PostgreSQL:      localhost:5432"
echo "   Redis:           localhost:6379"
echo ""
echo "📝 Para ver logs en tiempo real:"
echo "   $COMPOSE_CMD logs -f"
echo ""
echo "🛑 Para detener la aplicación:"
echo "   ./stop.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
