#!/bin/bash

# LiquiVerde - Script de Detención para Desarrollo Local

set -e

echo "🛑 Deteniendo servicios de desarrollo..."
echo ""

# Detener Backend
if [ -f .dev-pids/backend.pid ]; then
    BACKEND_PID=$(cat .dev-pids/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "✓ Backend detenido (PID: $BACKEND_PID)"
    fi
    rm .dev-pids/backend.pid
fi

# Detener Frontend
if [ -f .dev-pids/frontend.pid ]; then
    FRONTEND_PID=$(cat .dev-pids/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "✓ Frontend detenido (PID: $FRONTEND_PID)"
    fi
    rm .dev-pids/frontend.pid
fi

# Limpiar procesos huérfanos de uvicorn y vite
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Detener servicios de base de datos Docker (opcional)
if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD=""
    fi

    if [ -n "$COMPOSE_CMD" ]; then
        # Verificar si los contenedores de DB están corriendo
        if docker ps --format '{{.Names}}' | grep -q "liquiverde-postgres\|liquiverde-redis"; then
            echo ""
            read -p "¿Detener también PostgreSQL y Redis? [y/N] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                $COMPOSE_CMD stop postgres redis
                echo "✓ Servicios de datos detenidos"
            fi
        fi
    fi
fi

echo ""
echo "✅ Todos los servicios de desarrollo detenidos"
echo ""
