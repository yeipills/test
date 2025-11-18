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

echo ""
echo "✅ Todos los servicios de desarrollo detenidos"
echo ""
