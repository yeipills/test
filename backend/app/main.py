"""
LiquiVerde Smart Retail Platform - Backend API
FastAPI application con optimización multi-objetivo de compras
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from .routes import products_router, shopping_list_router, recommendations_router

# Crear aplicación FastAPI
app = FastAPI(
    title="LiquiVerde Smart Retail API",
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
    - OpenStreetMap (geolocalización)

    ## Uso de IA en el Desarrollo

    Este proyecto fue desarrollado con asistencia de Claude (Anthropic):
    - Diseño de algoritmos de optimización multi-objetivo
    - Implementación del sistema de scoring de sostenibilidad
    - Arquitectura de API REST con FastAPI
    - Estructura de datos y modelos Pydantic
    - Sistema de recomendaciones basado en similitud

    El desarrollador implementó la lógica de negocio, decisiones de arquitectura,
    y validación de algoritmos. La IA asistió en código boilerplate, documentación
    y optimizaciones.
    """,
    version="1.0.0",
    contact={
        "name": "Grupo Lagos - LiquiVerde",
        "url": "https://github.com/yourusername/liquiverde",
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
    """Health check endpoint"""
    return {"status": "healthy", "service": "liquiverde-api"}


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
