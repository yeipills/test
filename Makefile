# LiquiVerde - Makefile
# Comandos útiles para gestionar la aplicación

.PHONY: help start stop restart logs clean dev dev-stop build test

# Detectar Docker Compose command
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

help: ## Mostrar esta ayuda
	@echo "🌿 LiquiVerde - Comandos Disponibles"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

start: ## Iniciar aplicación con Docker
	@./start.sh

stop: ## Detener aplicación Docker
	@./stop.sh

restart: ## Reiniciar aplicación Docker
	@./restart.sh

logs: ## Ver logs en tiempo real
	@$(DOCKER_COMPOSE) logs -f

logs-backend: ## Ver logs solo del backend
	@$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## Ver logs solo del frontend
	@$(DOCKER_COMPOSE) logs -f frontend

status: ## Ver estado de los servicios
	@$(DOCKER_COMPOSE) ps

build: ## Reconstruir imágenes Docker
	@echo "🏗️  Reconstruyendo imágenes..."
	@$(DOCKER_COMPOSE) build --no-cache

clean: ## Limpiar contenedores, volúmenes e imágenes
	@echo "🧹 Limpiando todo..."
	@$(DOCKER_COMPOSE) down -v
	@docker system prune -f
	@echo "✅ Limpieza completada"

dev: ## Iniciar en modo desarrollo (sin Docker)
	@mkdir -p logs
	@./start-dev.sh

dev-stop: ## Detener modo desarrollo
	@./stop-dev.sh

backend-shell: ## Abrir shell en contenedor backend
	@$(DOCKER_COMPOSE) exec backend /bin/bash

frontend-shell: ## Abrir shell en contenedor frontend
	@$(DOCKER_COMPOSE) exec frontend /bin/sh

db-backup: ## Backup del dataset
	@mkdir -p backups
	@cp data/products_dataset.json backups/products_dataset_$(shell date +%Y%m%d_%H%M%S).json
	@echo "✅ Backup creado en backups/"

health: ## Verificar salud de los servicios
	@echo "🔍 Verificando salud..."
	@curl -s http://localhost:8000/health || echo "❌ Backend no responde"
	@curl -s http://localhost/ > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend no responde"

install-dev: ## Instalar dependencias de desarrollo
	@echo "📦 Instalando dependencias de desarrollo..."
	@cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@cd frontend && npm install
	@echo "✅ Dependencias instaladas"

test-api: ## Test rápido del API
	@echo "🧪 Probando API..."
	@curl -s http://localhost:8000/health | jq .
	@curl -s http://localhost:8000/api/stats | jq .

# Comandos de utilidad
.DEFAULT_GOAL := help
