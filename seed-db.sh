#!/bin/bash

# LiquiVerde - Script para poblar la base de datos
# Ejecuta el seed script de Python para cargar datos iniciales

set -e

echo "🌿 LiquiVerde - Poblando base de datos..."
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "backend/scripts/seed_db.py" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

cd backend

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✓ Entorno virtual activado"
fi

# Ejecutar seed script
echo "🗄️  Ejecutando script de seed..."
python scripts/seed_db.py

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Base de datos poblada exitosamente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
