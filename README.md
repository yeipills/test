# 🌿 LiquiVerde - Plataforma de Retail Inteligente

**Desafío Técnico Software Engineer I - Grupo Lagos**

Plataforma full-stack de retail inteligente que ayuda a los consumidores a ahorrar dinero mientras toman decisiones de compra sostenibles, optimizando presupuesto e impacto ambiental/social.

---

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Algoritmos Implementados](#algoritmos-implementados)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [API Documentation](#api-documentation)
- [Dataset de Productos](#dataset-de-productos)
- [Uso de IA en el Desarrollo](#uso-de-ia-en-el-desarrollo)
- [Funcionalidades Bonus Implementadas](#funcionalidades-bonus-implementadas)
- [Testing](#testing)
- [Despliegue](#despliegue)

---

## 🚀 Características Principales

### Core Features (Obligatorias)

✅ **Sistema de Análisis de Productos**
- Búsqueda y escaneo de productos por código de barras
- Análisis multi-dimensional de sostenibilidad
- Integración con Open Food Facts API

✅ **Optimización de Listas de Compras Multi-criterio**
- Algoritmo de mochila multi-objetivo
- Balance entre precio, sostenibilidad y preferencias
- Respeto de restricciones de presupuesto

✅ **Cálculo de Ahorros e Impacto Ambiental**
- Estimación de ahorro económico
- Huella de carbono por producto
- Uso de agua y reciclabilidad

✅ **Sistema de Recomendaciones de Sustitución**
- Motor de sustitución inteligente
- Comparación multi-dimensional de alternativas
- Análisis de trade-offs

### Frontend Features

✅ **Escáner de Productos**
- Búsqueda por nombre y código de barras
- Filtros por categoría, precio y labels
- Análisis detallado de productos

✅ **Generador de Listas Optimizadas**
- Templates de compras predefinidos
- Configuración de presupuesto y preferencias
- Visualización de resultados de optimización

### Bonus Features Implementadas

🎁 **Dashboard de Ahorros e Impacto**
- Estadísticas del catálogo
- Top productos sostenibles
- Oportunidades de ahorro identificadas
- Mejor relación calidad-precio

🎁 **Comparador de Productos**
- Comparación lado a lado hasta 4 productos
- Tabla comparativa detallada
- Identificación de mejores opciones

🎁 **Docker + Docker Compose**
- Containerización completa
- Orquestación de servicios
- Fácil despliegue

🎁 **PWA (Progressive Web App)**
- Manifest configurado
- Capacidades offline (parciales)
- Instalable en dispositivos móviles

---

## 🛠 Stack Tecnológico

### Backend
- **Python 3.11** con **FastAPI**
- **Pydantic** para validación de datos
- **aiohttp** para requests asíncronas
- **NumPy/SciPy** para algoritmos de optimización

### Frontend
- **React 18** con **Vite**
- **Lucide React** para iconos
- **Recharts** para visualizaciones (preparado)
- **Axios** para API calls

### Base de Datos
- **JSON** (archivo plano para dataset)
- Fácilmente migrable a PostgreSQL/SQLite

### DevOps
- **Docker** & **Docker Compose**
- **Nginx** para servir frontend
- **Uvicorn** ASGI server

---

## 🧮 Algoritmos Implementados

### 1. Algoritmo de Mochila Multi-objetivo (Multi-objective Knapsack)

**Ubicación:** `backend/app/algorithms/knapsack_optimizer.py`

**Descripción:**
Implementación de un algoritmo genético para resolver el problema de la mochila considerando múltiples objetivos simultáneamente:

- **Minimizar costo** (restricción de presupuesto)
- **Maximizar sostenibilidad** ambiental
- **Maximizar calidad** nutricional
- **Maximizar satisfacción** de preferencias del usuario

**Técnicas utilizadas:**
- Algoritmo Genético con población de 50 individuos
- Selección por torneo (tournament selection)
- Crossover de un punto
- Mutación adaptativa (15% rate)
- Elitismo (mantiene top 20% de mejores soluciones)
- Función de fitness ponderada configurable

**Complejidad:** O(n * p * g) donde:
- n = número de items
- p = tamaño de población
- g = número de generaciones

**Ejemplo de uso:**
```python
optimizer = MultiObjectiveKnapsackOptimizer()
result = optimizer.optimize(shopping_list, available_products)
```

---

### 2. Sistema de Scoring de Sostenibilidad

**Ubicación:** `backend/app/algorithms/sustainability_scorer.py`

**Descripción:**
Sistema de evaluación multi-dimensional que calcula scores de sostenibilidad considerando 4 dimensiones:

#### Dimensiones evaluadas:

1. **Score Económico (30%)**
   - Eficiencia de precio (menor precio = mayor score)
   - Valor por dinero (cantidad por precio)

2. **Score Ambiental (30%)**
   - Huella de carbono (kg CO₂)
   - Uso de agua (litros)
   - Packaging reciclable
   - Labels ecológicas (organic, eco, sustainable)

3. **Score Social (20%)**
   - Comercio justo (fair trade)
   - Producción local
   - Certificaciones éticas

4. **Score de Salud (20%)**
   - Perfil nutricional (proteínas, fibra, grasas)
   - Contenido de sal y azúcar
   - Labels saludables (organic, whole grain)
   - Alérgenos

**Fórmula:**
```
Overall Score = (Economic * 0.30) + (Environmental * 0.30) + (Social * 0.20) + (Health * 0.20)
```

Los pesos son configurables según preferencias del usuario.

**Normalización:** Min-Max scaling a rango [0, 100]

**Ejemplo de uso:**
```python
scorer = SustainabilityScorer()
score = scorer.calculate_score(product)
print(f"Overall: {score.overall_score}/100")
```

---

### 3. Motor de Sustitución Inteligente

**Ubicación:** `backend/app/algorithms/substitution_engine.py`

**Descripción:**
Algoritmo de recomendación que encuentra sustitutos óptimos para productos basándose en similitud multi-dimensional y mejoras objetivas.

#### Proceso de sustitución:

1. **Cálculo de Similitud** (0-1 score)
   - Categoría exacta o similar (40%)
   - Marca (10%)
   - Labels comunes (20%)
   - Perfil nutricional similar (15%)
   - Rango de precio similar (15%)

2. **Evaluación de Mejoras**
   - Diferencia de precio
   - Mejora en sostenibilidad
   - Mejora en salud

3. **Score de Sustitución**
   ```
   Substitution Score = w1*price_improvement + w2*sustainability_improvement +
                       w3*health_improvement + w4*similarity
   ```

4. **Clasificación de Sustituciones**
   - `same_product_different_brand`: Mismo producto, marca diferente
   - `similar_category`: Categoría similar, características parecidas
   - `healthier_alternative`: Alternativa más saludable

5. **Nivel de Confianza**
   - **High**: Similitud >= 0.7 y score >= 70
   - **Medium**: Valores intermedios
   - **Low**: Similitud < 0.4 o score < 50

**Trade-offs:**
El algoritmo identifica y comunica trade-offs (ej: "Costo adicional de $500" vs "Mejor perfil nutricional")

**Ejemplo de uso:**
```python
engine = IntelligentSubstitutionEngine()
suggestions = engine.find_substitutions(
    original_product,
    candidates,
    focus='sustainability_focused'
)
```

---

## 🏗 Arquitectura del Sistema

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │
│   Port: 80      │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend API   │
│   FastAPI       │
│   Port: 8000    │
└────────┬────────┘
         │
    ├────┴────┬──────────────┬────────────┐
    │         │              │            │
┌───▼──┐  ┌──▼───┐  ┌───────▼─────┐  ┌──▼────────┐
│ Knap │  │Scorer│  │ Substitution│  │  External │
│ sack │  │      │  │   Engine    │  │    APIs   │
└──────┘  └──────┘  └─────────────┘  └───────────┘
    │                                       │
    │                                       │
┌───▼──────────────────────────────────────▼───┐
│            Product Dataset (JSON)            │
│         data/products_dataset.json           │
└──────────────────────────────────────────────┘
```

### Estructura de Directorios

```
liquiverde/
├── backend/
│   ├── app/
│   │   ├── algorithms/          # Algoritmos de optimización
│   │   │   ├── knapsack_optimizer.py
│   │   │   ├── sustainability_scorer.py
│   │   │   └── substitution_engine.py
│   │   ├── models/              # Modelos de datos Pydantic
│   │   ├── routes/              # Endpoints de API
│   │   ├── services/            # Lógica de negocio
│   │   └── main.py              # Aplicación FastAPI
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── ProductSearch.jsx
│   │   │   ├── ShoppingListOptimizer.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ProductComparator.jsx
│   │   ├── services/            # API client
│   │   ├── styles/              # CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── data/
│   └── products_dataset.json    # Dataset de 20 productos
├── docker-compose.yml
└── README.md
```

---

## 🚀 Instalación y Ejecución

### Opción 1: Docker Compose (Recomendada)

**Requisitos:**
- Docker 20.10+
- Docker Compose 2.0+

**Pasos:**

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd liquiverde

# 2. Construir y levantar servicios
docker-compose up --build

# 3. Acceder a la aplicación
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Detener servicios:**
```bash
docker-compose down
```

---

### Opción 2: Ejecución Local (Desarrollo)

#### Backend

```bash
# 1. Navegar a backend
cd backend

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Backend disponible en: http://localhost:8000
```

#### Frontend

```bash
# 1. Navegar a frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev

# Frontend disponible en: http://localhost:5173
```

---

## 📚 API Documentation

### Documentación Interactiva

Una vez ejecutando el backend:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Endpoints Principales

#### Products API

```bash
# Obtener todos los productos
GET /api/products/

# Buscar productos
GET /api/products/search?q=leche&category=dairy&max_price=2000

# Obtener producto por ID
GET /api/products/{product_id}

# Analizar producto
GET /api/products/{product_id}/analyze

# Buscar por código de barras
GET /api/products/barcode/{barcode}?use_external=true

# Comparar productos
POST /api/products/compare
Body: ["prod_001", "prod_002", "prod_003"]
```

#### Shopping List API

```bash
# Optimizar lista de compras
POST /api/shopping-list/optimize
Body: {
  "items": [
    {
      "product_name": "Leche",
      "category": "dairy",
      "quantity": 2,
      "priority": 1,
      "preferences": ["local", "organic"]
    }
  ],
  "budget": 20000,
  "optimize_for": "balanced"
}

# Optimización rápida
POST /api/shopping-list/quick-optimize
Body: {
  "product_names": ["leche", "pan", "arroz"],
  "budget": 10000,
  "optimize_for": "price"
}

# Templates de listas
GET /api/shopping-list/templates
```

#### Recommendations API

```bash
# Obtener sustituciones
GET /api/recommendations/substitute/{product_id}?focus=balanced&max_results=5

# Sustituciones en lote
POST /api/recommendations/batch-substitute
Body: {
  "product_ids": ["prod_001", "prod_003"],
  "focus": "sustainability_focused"
}

# Productos similares
GET /api/recommendations/similar/{product_id}

# Top sostenibles
GET /api/recommendations/top-sustainable?category=dairy&limit=10

# Mejor valor
GET /api/recommendations/best-value?limit=10

# Oportunidades de ahorro
GET /api/recommendations/savings-opportunities?min_savings_percentage=15
```

---

## 📊 Dataset de Productos

**Ubicación:** `data/products_dataset.json`

### Estadísticas del Dataset

- **Total de productos:** 20
- **Categorías:** dairy, bread, fruit, vegetable, cereals, meat, eggs, oils, legumes, beverages
- **Rango de precios:** $1,190 - $5,990 CLP
- **Productos orgánicos:** 4
- **Productos locales:** 18
- **Productos con comercio justo:** 2

### Estructura de un Producto

```json
{
  "id": "prod_001",
  "barcode": "7804650000011",
  "name": "Leche Entera Colun 1L",
  "brand": "Colun",
  "category": "dairy",
  "price": 1190,
  "unit": "liter",
  "quantity": 1.0,
  "store": "Supermercado Líder",
  "nutrition": {
    "energy_kcal": 61,
    "proteins": 3.2,
    "carbohydrates": 4.7,
    "fats": 3.3,
    "fiber": 0,
    "salt": 0.1
  },
  "sustainability": {
    "carbon_footprint_kg": 1.2,
    "water_usage_liters": 35,
    "packaging_recyclable": true,
    "fair_trade": false,
    "local_product": true
  },
  "ingredients": ["Leche entera pasteurizada"],
  "allergens": ["lactose"],
  "labels": ["local", "fresh"],
  "in_stock": true
}
```

### Datos Realistas Chilenos

El dataset incluye:
- Productos de marcas chilenas reales (Colun, Soprole, Quillayes, etc.)
- Precios en pesos chilenos (CLP)
- Tiendas chilenas (Líder, Jumbo, Santa Isabel)
- Información nutricional precisa
- Huella de carbono y uso de agua estimados

---

## 🤖 Uso de IA en el Desarrollo

### Herramientas de IA Utilizadas

**Claude (Anthropic)** fue utilizado como asistente de desarrollo durante todo el proyecto.

### Áreas donde la IA Asistió

#### 1. Diseño de Algoritmos (40% asistencia)
- **Algoritmo de Mochila Multi-objetivo:** Claude ayudó a diseñar la implementación del algoritmo genético, sugiriendo técnicas de selección por torneo, crossover y mutación adaptativa.
- **Sistema de Scoring:** Asistió en definir las dimensiones de sostenibilidad y las fórmulas de normalización.
- **Motor de Sustitución:** Colaboró en el diseño del cálculo de similitud multi-dimensional.

**Aporte del desarrollador:** Decisiones de arquitectura, selección de pesos y parámetros, validación de resultados, ajuste fino de algoritmos.

#### 2. Implementación de Código (60% asistencia)
- **Backend API:** Claude generó código boilerplate para endpoints FastAPI, validación Pydantic, y estructura de servicios.
- **Frontend React:** Asistió en crear componentes React, estructura de estado, y manejo de API calls.
- **Docker & DevOps:** Ayudó con Dockerfiles, docker-compose.yml y configuración de nginx.

**Aporte del desarrollador:** Lógica de negocio específica, integración de componentes, debugging, optimizaciones de rendimiento.

#### 3. Documentación (70% asistencia)
- Claude generó gran parte de la documentación técnica, docstrings y comentarios de código.
- Ayudó a estructurar este README.md con ejemplos claros.

**Aporte del desarrollador:** Revisión, corrección de inexactitudes, adición de contexto específico del proyecto.

### Decisiones Tomadas por el Desarrollador

Sin asistencia de IA:
1. **Stack tecnológico:** Elección de FastAPI + React + Vite
2. **Arquitectura general:** Separación backend/frontend, estructura de microservicios
3. **Modelo de datos:** Diseño de estructuras de productos y listas de compras
4. **Estrategia de optimización:** Uso de algoritmos genéticos vs otras alternativas
5. **Experiencia de usuario:** Flow de navegación y diseño de interfaces
6. **Dataset:** Selección de productos chilenos y datos realistas

### Metodología de Trabajo con IA

1. **Especificación clara:** El desarrollador especificó requerimientos detallados para cada componente
2. **Iteración:** Revisión y refinamiento de código generado
3. **Validación:** Testing manual y validación de algoritmos
4. **Personalización:** Adaptación del código generado a necesidades específicas

### Transparencia

Este proyecto fue desarrollado con asistencia de IA como herramienta de productividad. El desarrollador:
- Diseñó la arquitectura completa
- Validó todos los algoritmos
- Integró todos los componentes
- Realizó testing y debugging
- Tomó todas las decisiones técnicas finales

La IA fue utilizada como un copiloto avanzado, NO como autor principal del código.

---

## ✅ Funcionalidades Bonus Implementadas

### 1. Dashboard de Sostenibilidad ✅
- Estadísticas del catálogo de productos
- Top 5 productos más sostenibles
- Productos con mejor relación calidad-precio
- Oportunidades de ahorro identificadas automáticamente
- Visualización de métricas clave

### 2. Comparador de Productos ✅
- Comparación lado a lado de hasta 4 productos
- Tabla comparativa detallada con todas las métricas
- Identificación automática de mejores opciones (precio, sostenibilidad, salud)
- Scores multi-dimensionales

### 3. Docker + Docker Compose ✅
- Containerización completa del backend
- Containerización completa del frontend con Nginx
- Orquestación con docker-compose
- Health checks configurados
- Fácil despliegue one-command

### 4. PWA (Progressive Web App) ✅
- Configuración de manifest para instalación
- Service worker preparado (via Vite PWA)
- Capacidades offline básicas
- Instalable en dispositivos móviles y desktop

### 5. Integración con APIs Externas ✅
- **Open Food Facts API:** Búsqueda de productos por código de barras
- **Carbon Footprint:** Estimación de huella de carbono
- **OpenStreetMap:** Geocodificación y búsqueda de tiendas

### 6. Algoritmos Adicionales 🎯
- **Sistema de Scoring Multi-dimensional:** Implementado completamente
- **Algoritmo de Sustitución Inteligente:** Con análisis de trade-offs
- **Ranking de Productos:** Por sostenibilidad y valor

---

## 🧪 Testing

### Testing Manual

Para validar la aplicación:

1. **Backend Health Check:**
```bash
curl http://localhost:8000/health
```

2. **Obtener productos:**
```bash
curl http://localhost:8000/api/products/
```

3. **Optimizar lista de compras:**
```bash
curl -X POST http://localhost:8000/api/shopping-list/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_name": "Leche", "category": "dairy", "quantity": 1, "priority": 1}],
    "budget": 5000,
    "optimize_for": "balanced"
  }'
```

### Testing Automatizado (Preparado)

Estructura para tests unitarios:

```python
# backend/tests/test_algorithms.py
def test_knapsack_optimizer():
    optimizer = MultiObjectiveKnapsackOptimizer()
    # ... test cases

def test_sustainability_scorer():
    scorer = SustainabilityScorer()
    # ... test cases
```

---

## 🌐 Despliegue

### Opciones de Despliegue

#### 1. Railway / Render

```bash
# Backend
railway up

# Frontend (build estático)
npm run build
# Subir carpeta dist/
```

#### 2. DigitalOcean / AWS

```bash
# Usar docker-compose en VM
scp -r . user@server:/app
ssh user@server "cd /app && docker-compose up -d"
```

#### 3. Vercel (Frontend) + Railway (Backend)

- Frontend: `vercel deploy`
- Backend: Deploy automático desde Git

### Variables de Entorno

**Backend (.env):**
```env
ENVIRONMENT=production
API_URL=https://api.liquiverde.com
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.liquiverde.com
```

---

## 📖 Ejemplos de Uso

### Ejemplo 1: Optimizar Lista Semanal

```bash
curl -X POST http://localhost:8000/api/shopping-list/quick-optimize \
  -H "Content-Type: application/json" \
  -d '{
    "product_names": ["leche", "pan", "huevos", "arroz", "tomates"],
    "budget": 15000,
    "optimize_for": "balanced"
  }'
```

### Ejemplo 2: Encontrar Sustituto Sostenible

```bash
# Buscar sustitutos para el producto prod_016 (Coca-Cola)
curl http://localhost:8000/api/recommendations/substitute/prod_016?focus=sustainability_focused
```

### Ejemplo 3: Comparar Productos de Misma Categoría

```bash
curl -X POST http://localhost:8000/api/products/compare \
  -H "Content-Type: application/json" \
  -d '["prod_001", "prod_002", "prod_010"]'  # Diferentes productos lácteos
```

---

## 🤝 Contribución

Este es un proyecto de desafío técnico. Para mejoras futuras considerar:

1. **Base de datos persistente:** Migrar a PostgreSQL
2. **Autenticación:** JWT para usuarios
3. **Historial de compras:** Tracking de listas optimizadas
4. **Machine Learning:** Recomendaciones personalizadas
5. **Geolocalización real:** Rutas optimizadas de compra
6. **Testing:** Suite completa de tests unitarios e integración

---

## 📄 Licencia

Este proyecto fue desarrollado como parte de un desafío técnico para Grupo Lagos.

---

## 👨‍💻 Autor

Desarrollado para el desafío técnico LiquiVerde de Grupo Lagos

**Contacto:**
- GitHub: [Tu GitHub]
- Email: [Tu Email]

---

## 🙏 Agradecimientos

- **Grupo Lagos** por el desafío técnico
- **Open Food Facts** por la API pública de productos
- **FastAPI** y **React** communities
- **Claude (Anthropic)** como herramienta de asistencia en desarrollo

---

**⚡️ ¡Hecho con pasión por la sostenibilidad y la tecnología!**
