# Arquitectura de LiquiVerde

## Visión General

LiquiVerde es una plataforma de retail inteligente que optimiza listas de compras para maximizar sostenibilidad mientras respeta restricciones de presupuesto.

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │
│  │Dashboard│ │Optimizer │ │Products │ │   StoreMap   │  │
│  └────┬────┘ └────┬─────┘ └────┬────┘ └──────┬───────┘  │
└───────┼──────────┼──────────┼───────────────┼───────────┘
        │          │          │               │
        └──────────┴──────────┴───────────────┘
                          │
                    ┌─────▼─────┐
                    │  Nginx    │
                    │  Reverse  │
                    │  Proxy    │
                    └─────┬─────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   BACKEND (FastAPI)                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐    │
│  │   Routes   │  │  Services  │  │   Algorithms    │    │
│  │ /products  │  │  Product   │  │    Knapsack     │    │
│  │ /shopping  │  │  Service   │  │   Optimizer     │    │
│  │ /recommend │  │            │  │  Sustainability │    │
│  └─────┬──────┘  └──────┬─────┘  └────────┬────────┘    │
└────────┼────────────────┼─────────────────┼─────────────┘
         │                │                 │
    ┌────▼────┐      ┌────▼────┐       ┌────▼────┐
    │PostgreSQL│      │  Redis  │       │  Data   │
    │   DB    │      │  Cache  │       │  JSON   │
    └─────────┘      └─────────┘       └─────────┘
```

## Decisiones de Arquitectura

### Backend: FastAPI vs Django

**Elegido: FastAPI**

| Criterio | FastAPI | Django |
|----------|---------|--------|
| Performance | Async nativo, muy rápido | Sync por defecto |
| Tipado | Pydantic integrado | Requiere DRF |
| Documentación | Swagger automático | Manual |
| Curva aprendizaje | Baja | Media |
| Ecosistema | Creciente | Maduro |

**Razón**: Para una API de optimización, la velocidad y el tipado estricto son críticos.

### Frontend: Vite + React vs Next.js

**Elegido: Vite + React**

| Criterio | Vite + React | Next.js |
|----------|--------------|---------|
| Build time | Muy rápido (ESBuild) | Más lento |
| SSR | No necesario | Incluido |
| Complejidad | Baja | Media |
| PWA | Plugin simple | Configuración manual |

**Razón**: No necesitamos SSR, priorizamos velocidad de desarrollo y builds.

### Base de Datos: PostgreSQL vs SQLite

**Elegido: PostgreSQL**

| Criterio | PostgreSQL | SQLite |
|----------|------------|--------|
| Concurrencia | Excelente | Limitada |
| JSON support | JSONB nativo | Básico |
| Escalabilidad | Horizontal | Solo vertical |
| Producción | Estándar | No recomendado |

**Razón**: Necesitamos queries complejas sobre datos de productos con campos JSON.

### Cache: Redis vs In-Memory

**Elegido: Redis**

**Razón**: Persistencia entre reinicios, compartido entre workers, TTL automático.

## Estructura del Proyecto

```
liquiverde/
├── backend/
│   ├── app/
│   │   ├── algorithms/          # Core de optimización
│   │   │   ├── knapsack_optimizer.py
│   │   │   ├── sustainability_scorer.py
│   │   │   └── substitution_engine.py
│   │   ├── models/              # Pydantic schemas
│   │   │   ├── product.py
│   │   │   ├── shopping_list.py
│   │   │   └── recommendation.py
│   │   ├── routes/              # API endpoints
│   │   │   ├── products.py
│   │   │   ├── shopping_list.py
│   │   │   └── recommendations.py
│   │   ├── services/            # Business logic
│   │   │   ├── product_service.py
│   │   │   └── external_api_service.py
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # DB connection
│   │   └── cache.py             # Redis client
│   ├── tests/                   # Pytest suite
│   ├── docs/                    # Algorithm docs
│   └── scripts/                 # DB scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/            # API client
│   │   └── styles/              # CSS
│   └── public/                  # Static assets
│
├── data/
│   └── products_dataset.json    # Catálogo inicial
│
└── docker-compose.yml           # Orquestación
```

## Flujo de Datos

### Optimización de Lista de Compras

```
1. Usuario crea lista
   ┌─────────────┐
   │ Frontend    │ POST /api/shopping-list/optimize
   │ [items,     │─────────────────────────────────►
   │  budget,    │
   │  optimize]  │
   └─────────────┘

2. Backend procesa
   ┌─────────────┐
   │ Route       │
   │ shopping_   │
   │ list.py     │
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │ Product     │ get_product_catalog()
   │ Service     │─────────────────────►┌─────────┐
   └──────┬──────┘                      │  Redis  │
          │                             │  Cache  │
          │◄────────────────────────────└─────────┘
   ┌──────▼──────┐
   │ Knapsack    │ optimize(list, catalog)
   │ Optimizer   │
   └──────┬──────┘
          │
   ┌──────▼──────┐
   │Sustainability│ calculate_score(product)
   │  Scorer     │
   └──────┬──────┘
          │
3. Respuesta
          │
   ┌──────▼──────┐
   │ Optimized   │
   │ Shopping    │
   │ List        │
   └─────────────┘
```

### Búsqueda de Productos

```
Frontend                    Backend                     Data
   │                           │                          │
   │ GET /products/search      │                          │
   │ ?q=leche&category=dairy   │                          │
   │──────────────────────────►│                          │
   │                           │ Check cache              │
   │                           │─────────────────────────►│
   │                           │◄─────────────────────────│
   │                           │                          │
   │                           │ (if miss) Load JSON      │
   │                           │─────────────────────────►│
   │                           │◄─────────────────────────│
   │                           │                          │
   │                           │ Filter & Score           │
   │                           │                          │
   │◄──────────────────────────│                          │
   │ [products with scores]    │                          │
```

## Patrones de Diseño

### Repository Pattern (Services)

```python
class ProductService:
    def __init__(self):
        self.cache = CacheService()
        self.data_path = "data/products_dataset.json"

    def get_product_catalog(self) -> Dict[str, List[Product]]:
        # Abstrae acceso a datos
        cached = self.cache.get("catalog")
        if cached:
            return cached
        return self._load_from_file()
```

### Strategy Pattern (Optimization)

```python
class MultiObjectiveKnapsackOptimizer:
    def _select_best_product(self, item, candidates, optimize_for):
        # Estrategia cambia según objetivo
        if optimize_for == "price":
            return min(candidates, key=lambda p: p.price)
        elif optimize_for == "sustainability":
            return max(candidates, key=lambda p: self.scorer.calculate_score(p))
```

### Dependency Injection

```python
# El optimizador recibe el scorer inyectado
scorer = SustainabilityScorer()
optimizer = MultiObjectiveKnapsackOptimizer(sustainability_scorer=scorer)
```

## API Design

### RESTful Endpoints

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/products | Listar productos |
| GET | /api/products/search | Buscar productos |
| GET | /api/products/{id} | Obtener producto |
| POST | /api/shopping-list/optimize | Optimizar lista |
| POST | /api/shopping-list/quick-optimize | Optimización rápida |
| GET | /api/recommendations/savings | Oportunidades de ahorro |

### Response Format

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  },
  "warnings": ["..."]
}
```

## Escalabilidad

### Horizontal Scaling

```
                    ┌─────────────┐
                    │   Nginx     │
                    │   Load      │
                    │   Balancer  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Backend 1  │ │  Backend 2  │ │  Backend 3  │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │   Redis     │
                    │   Cluster   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   Primary   │
                    └─────────────┘
```

### Caching Strategy

```python
# Cache por niveles
CACHE_TTL = {
    'product_catalog': 3600,      # 1 hora
    'search_results': 300,        # 5 minutos
    'optimization_result': 60,    # 1 minuto (personalizado)
}
```

## Seguridad

### Implementado

- CORS configurado para dominios específicos
- Validación de inputs con Pydantic
- Sanitización de queries de búsqueda
- Rate limiting en endpoints críticos

### Por Implementar

- Autenticación JWT
- API keys para acceso externo
- Audit logging
- Encriptación de datos sensibles

## Monitoreo

### Métricas Recomendadas

```python
# Prometheus metrics
optimization_duration = Histogram(
    'optimization_duration_seconds',
    'Time spent on optimization'
)

products_searched = Counter(
    'products_searched_total',
    'Number of product searches'
)

cache_hits = Counter(
    'cache_hits_total',
    'Number of cache hits'
)
```

### Health Checks

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": check_db_connection(),
        "cache": check_redis_connection(),
        "version": "1.0.0"
    }
```

## Desarrollo Futuro

### Corto Plazo
- [ ] Autenticación de usuarios
- [ ] Historial de listas
- [ ] Notificaciones de ofertas

### Mediano Plazo
- [ ] Machine learning para preferencias
- [ ] Integración con supermercados reales
- [ ] App móvil nativa

### Largo Plazo
- [ ] Marketplace de productores locales
- [ ] Gamificación de sostenibilidad
- [ ] API pública para terceros
