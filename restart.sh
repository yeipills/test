#!/bin/bash

# LiquiVerde - Script de Reinicio
# Reinicia todos los servicios de la aplicación

set -e

echo "🌿 LiquiVerde - Reiniciando aplicación..."
echo ""

# Ejecutar detención
./stop.sh

echo ""
echo "⏳ Esperando 3 segundos..."
sleep 3

# Ejecutar inicio
./start.sh
