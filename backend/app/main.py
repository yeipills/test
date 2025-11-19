"""
LiquiVerde Smart Retail Platform - Backend API
FastAPI application con optimización multi-objetivo de compras
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from .routes import products_router, shopping_list_router, recommendations_router
from .database import init_db
from .cache import cache_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Initializing database tables...")
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization skipped (may not be available): {e}")

    # Check Redis
    if cache_service.is_available():
        print("Redis cache connected successfully")
    else:
        print("Redis cache not available - running without cache")

    yield

    # Shutdown
    print("Shutting down LiquiVerde API...")

# Crear aplicación FastAPI
app = FastAPI(
    title="LiquiVerde Smart Retail API",
    redoc_url=None,  # Disable ReDoc (use /docs Swagger UI instead)
    lifespan=lifespan,
    description="""
    🌿 Plataforma de retail inteligente para compras sostenibles y económicas

    ## Características Principales

    ### Algoritmos Implementados:
    1. **Algoritmo de Mochila Multi-objetivo**: Optimiza listas de compras balanceando precio, sostenibilidad y preferencias
    2. **Sistema de Scoring de Sostenibilidad**: Evalúa productos en 4 dimensiones (económica, ambiental, social, salud)
    3. **Motor de Sustitución Inteligente**: Encuentra alternativas mejores basado en múltiples criterios

    ### APIs Disponibles:
    - **Products**: Búsqueda, análisis y comparación de productos
    - **Shopping List**: Optimización inteligente de listas de compras
    - **Recommendations**: Sustituciones y recomendaciones personalizadas

    ### Integraciones Externas:
    - Open Food Facts API (información nutricional)
    - Carbon Footprint estimation
    - Google Maps API (geolocalización y tiendas)
    """,
    version="1.0.0",
    contact={
        "name": "Juan Pablo Rosas Martín",
        "url": "https://github.com/yeipills",
        "email": "juanpablorosasmartin@gmail.com",
    },
)

# Configurar CORS para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative port
        "http://localhost:8080",
        "*",  # Para desarrollo - en producción usar dominios específicos
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(products_router)
app.include_router(shopping_list_router)
app.include_router(recommendations_router)


@app.get("/")
async def root():
    """Root endpoint con información de la API"""
    return {
        "message": "🌿 LiquiVerde Smart Retail API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "products": "/api/products",
            "shopping_list": "/api/shopping-list",
            "recommendations": "/api/recommendations",
        },
        "algorithms": [
            "Multi-Objective Knapsack Optimizer",
            "Sustainability Scoring System",
            "Intelligent Substitution Engine",
        ],
        "features": [
            "Product search and analysis",
            "Shopping list optimization",
            "Smart product substitutions",
            "Carbon footprint calculation",
            "Multi-dimensional sustainability scoring",
            "Budget-aware recommendations",
        ],
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with service status"""
    from .database import SessionLocal
    from sqlalchemy import text

    health = {
        "status": "healthy",
        "service": "liquiverde-api",
        "components": {
            "api": "up",
            "database": "unknown",
            "cache": "unknown"
        }
    }

    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health["components"]["database"] = "up"
    except Exception as e:
        health["components"]["database"] = "down"
        health["status"] = "degraded"

    # Check Redis
    if cache_service.is_available():
        health["components"]["cache"] = "up"
    else:
        health["components"]["cache"] = "down"
        health["status"] = "degraded"

    return health


@app.get("/api/stores/nearby")
async def get_nearby_stores(lat: float, lng: float, radius: float = 5.0):
    """Busca tiendas cercanas usando Google Maps API"""
    from .services.external_api_service import ExternalAPIService

    api_service = ExternalAPIService()
    stores = await api_service.find_nearby_stores(lat, lng, radius)

    def check_organic(name: str) -> bool:
        """Check if store likely has organic products based on name"""
        name_lower = name.lower()
        organic_keywords = ["organic", "orgánico", "organico", "natural", "bio", "eco", "verde", "saludable", "health", "whole"]
        return any(keyword in name_lower for keyword in organic_keywords)

    def check_local(name: str) -> bool:
        """Check if store is local (not a large chain)"""
        name_lower = name.lower()
        # Large chains in Chile
        large_chains = ["jumbo", "líder", "lider", "santa isabel", "tottus", "unimarc", "walmart", "costco", "makro"]
        is_chain = any(chain in name_lower for chain in large_chains)
        # Local store indicators
        local_keywords = ["local", "barrio", "vecino", "minimarket", "almacén", "almacen", "botillería", "botilleria", "express", "mini"]
        is_local = any(keyword in name_lower for keyword in local_keywords)
        return is_local or not is_chain

    return {
        "stores": [
            {
                "id": i + 1,
                "name": store.get("name", "Unknown"),
                "address": store.get("address", ""),
                "lat": store.get("lat", lat),
                "lng": store.get("lng", lng),
                "distance": store.get("distance_km", 0),
                "rating": store.get("rating", 0),
                "hasOrganic": check_organic(store.get("name", "")),
                "hasLocal": check_local(store.get("name", "")),
                "hours": store.get("hours", "Consultar horario"),
                "phone": store.get("phone", ""),
                "is_open": store.get("is_open"),
            }
            for i, store in enumerate(stores)
        ],
        "total": len(stores),
    }


@app.get("/api/stats")
async def get_stats():
    """Estadísticas generales del catálogo"""
    from .services.product_service import ProductService

    service = ProductService()
    products = service.get_all_products()
    categories = service.get_categories()

    # Calcular estadísticas
    total_products = len(products)

    if total_products == 0:
        return {
            "total_products": 0,
            "categories_count": 0,
            "categories": {},
            "average_price": 0,
            "price_range": {"min": 0, "max": 0},
            "labels": {"organic": 0, "local": 0},
            "message": "No products in catalog",
        }

    avg_price = sum(p.price for p in products) / total_products

    # Productos por categoría
    category_distribution = {}
    for cat in categories:
        cat_products = service.get_products_by_category(cat)
        category_distribution[cat] = len(cat_products)

    # Productos con diferentes labels
    organic_count = sum(1 for p in products if p.labels and "organic" in [l.lower() for l in p.labels])
    local_count = sum(1 for p in products if p.labels and "local" in [l.lower() for l in p.labels])

    return {
        "total_products": total_products,
        "categories_count": len(categories),
        "categories": category_distribution,
        "average_price": round(avg_price, 2),
        "price_range": {
            "min": min(p.price for p in products),
            "max": max(p.price for p in products),
        },
        "labels": {
            "organic": organic_count,
            "local": local_count,
        },
    }


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found", "path": str(request.url)},
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


if __name__ == "__main__":
    # Ejecutar servidor
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload en desarrollo
    )
