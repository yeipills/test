# Instrucciones Rápidas de Ejecución

## 🚀 Quick Start (Docker - Recomendado)

### Método 1: Scripts Automáticos (Más Fácil)

**Linux/Mac:**
```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd liquiverde

# 2. Iniciar aplicación
./start.sh

# 3. Detener aplicación
./stop.sh

# 4. Reiniciar aplicación
./restart.sh

# 5. Ver logs en tiempo real
./logs.sh
```

**Windows:**
```cmd
# 1. Clonar el repositorio
git clone <repo-url>
cd liquiverde

# 2. Iniciar aplicación
start.bat

# 3. Detener aplicación
stop.bat
```

### Método 2: Docker Compose Manual

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd liquiverde

# 2. Levantar todos los servicios
docker-compose up --build

# 3. Acceder a la aplicación
# Frontend: http://localhost
# Backend API Docs: http://localhost:8000/docs
```

### Método 3: Makefile (Para usuarios avanzados)

```bash
# Ver todos los comandos disponibles
make help

# Iniciar
make start

# Detener
make stop

# Ver logs
make logs

# Limpiar todo
make clean
```

¡Eso es todo! La aplicación completa estará corriendo.

---

## 🛠 Ejecución Local (Desarrollo)

### Método 1: Script Automático (Recomendado)

```bash
# Inicia backend y frontend automáticamente
./start-dev.sh

# Presiona Ctrl+C para detener todo

# O detener manualmente:
./stop-dev.sh
```

**Con Make:**
```bash
make dev        # Iniciar
make dev-stop   # Detener
```

### Método 2: Manual (Dos Terminales)

**Terminal 1 - Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend disponible en: http://localhost:8000

**Terminal 2 - Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en: http://localhost:5173

---

## 🧪 Testing Rápido

### Test Backend

```bash
# Health check
curl http://localhost:8000/health

# Obtener productos
curl http://localhost:8000/api/products/

# Optimizar lista
curl -X POST http://localhost:8000/api/shopping-list/quick-optimize \
  -H "Content-Type: application/json" \
  -d '{"product_names": ["leche", "pan", "arroz"], "budget": 10000, "optimize_for": "price"}'
```

### Test Frontend

1. Navega a http://localhost (o http://localhost:5173 en modo dev)
2. Haz clic en "Productos" y busca "leche"
3. Ve a "Optimizador" y usa un template
4. Explora el "Dashboard"

---

## 📋 Features para Demostrar

### 1. Búsqueda de Productos
- Ve a la pestaña "Productos"
- Busca "leche" o "tomate"
- Prueba escanear código: `7804650000011`
- Haz clic en un producto para ver análisis completo

### 2. Optimización de Lista
- Ve a la pestaña "Optimizador"
- Carga el template "Compra Semanal Básica"
- Configura presupuesto: 15000
- Optimizar para: "Balanceado"
- Haz clic en "Optimizar Lista de Compras"
- Revisa resultados: ahorro, sostenibilidad, impacto ambiental

### 3. Dashboard
- Ve a la pestaña "Dashboard"
- Observa estadísticas del catálogo
- Top 5 productos sostenibles
- Oportunidades de ahorro

### 4. Comparador
- Ve a la pestaña "Comparar"
- Selecciona 2-4 productos de diferentes categorías
- Haz clic en "Comparar Productos"
- Revisa tabla comparativa

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar puerto 8000 no está en uso
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Reinstalar dependencias
pip install --force-reinstall -r backend/requirements.txt
```

### Frontend no inicia
```bash
# Limpiar node_modules
rm -rf frontend/node_modules
cd frontend && npm install

# Limpiar caché
npm cache clean --force
```

### Docker issues
```bash
# Opción 1: Usar Makefile
make clean
make start

# Opción 2: Manual
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build --force-recreate
```

---

## 📚 Documentación

- **API Docs:** http://localhost:8000/docs
- **README completo:** README.md
- **Algoritmos:** Ver carpeta `backend/app/algorithms/`
- **Dataset:** `data/products_dataset.json`

---

## 📜 Scripts Disponibles

### Scripts Docker (Linux/Mac)

| Script | Descripción |
|--------|-------------|
| `./start.sh` | Inicia toda la aplicación con Docker |
| `./stop.sh` | Detiene todos los servicios |
| `./restart.sh` | Reinicia la aplicación completa |
| `./logs.sh` | Muestra logs en tiempo real |

### Scripts Docker (Windows)

| Script | Descripción |
|--------|-------------|
| `start.bat` | Inicia toda la aplicación con Docker |
| `stop.bat` | Detiene todos los servicios |

### Scripts Desarrollo (Linux/Mac)

| Script | Descripción |
|--------|-------------|
| `./start-dev.sh` | Inicia backend y frontend en modo dev |
| `./stop-dev.sh` | Detiene servicios de desarrollo |

### Comandos Make

| Comando | Descripción |
|---------|-------------|
| `make help` | Muestra todos los comandos disponibles |
| `make start` | Inicia con Docker |
| `make stop` | Detiene servicios Docker |
| `make restart` | Reinicia servicios |
| `make logs` | Ver logs de todos los servicios |
| `make logs-backend` | Ver logs solo del backend |
| `make logs-frontend` | Ver logs solo del frontend |
| `make status` | Ver estado de los servicios |
| `make build` | Reconstruir imágenes Docker |
| `make clean` | Limpiar todo (contenedores, volúmenes, imágenes) |
| `make dev` | Iniciar en modo desarrollo |
| `make dev-stop` | Detener modo desarrollo |
| `make health` | Verificar salud de los servicios |
| `make test-api` | Prueba rápida del API |

---

## ✨ Características Destacadas

✅ 3 Algoritmos implementados (todos obligatorios)
✅ Frontend completo con 4 vistas principales
✅ Dashboard de sostenibilidad (bonus)
✅ Comparador de productos (bonus)
✅ Docker + Docker Compose (bonus)
✅ PWA capabilities (bonus)
✅ Dataset realista con 20 productos chilenos
✅ Integración con APIs externas

---

¡Disfruta explorando la plataforma! 🌿
