#!/bin/bash

# LiquiVerde - Script de Inicio para Desarrollo Local
# Inicia backend y frontend en modo desarrollo (sin Docker)

set -e

echo "🌿 LiquiVerde - Iniciando en modo desarrollo..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: Python 3 no está instalado${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python y Node.js detectados${NC}"
echo ""

# Crear directorio para PIDs
mkdir -p .dev-pids

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."

    if [ -f .dev-pids/backend.pid ]; then
        kill $(cat .dev-pids/backend.pid) 2>/dev/null || true
        rm .dev-pids/backend.pid
    fi

    if [ -f .dev-pids/frontend.pid ]; then
        kill $(cat .dev-pids/frontend.pid) 2>/dev/null || true
        rm .dev-pids/frontend.pid
    fi

    echo "✅ Servicios detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend
echo "🔧 Iniciando Backend..."
cd backend

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "  Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
if [ ! -f "venv/.installed" ]; then
    echo "  Instalando dependencias..."
    pip install -q -r requirements.txt
    touch venv/.installed
fi

# Iniciar servidor
echo "  Iniciando servidor FastAPI..."
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.dev-pids/backend.pid

cd ..
echo -e "${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"

# Esperar que backend esté listo
echo "  Esperando que backend esté listo..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend listo!${NC}"
        break
    fi
    sleep 1
done

echo ""

# Iniciar Frontend
echo "🎨 Iniciando Frontend..."
cd frontend

# Instalar dependencias
if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias..."
    npm install
fi

# Iniciar servidor de desarrollo
echo "  Iniciando servidor Vite..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.dev-pids/frontend.pid

cd ..
echo -e "${GREEN}✓ Frontend iniciado (PID: $FRONTEND_PID)${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ ¡Aplicación en modo desarrollo iniciada!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Accesos:"
echo "   Frontend:        http://localhost:5173"
echo "   Backend API:     http://localhost:8000"
echo "   API Docs:        http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 Presiona Ctrl+C para detener todos los servicios"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mantener script corriendo
wait
