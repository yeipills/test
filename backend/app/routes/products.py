"""
Rutas de API para productos
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services.product_service import ProductService
from ..services.external_api_service import ExternalAPIService

router = APIRouter(prefix="/api/products", tags=["products"])

# Servicios compartidos
product_service = ProductService()
external_api_service = ExternalAPIService()


@router.get("/")
async def get_all_products():
    """Obtiene todos los productos disponibles"""
    products = product_service.get_all_products()
    return {"count": len(products), "products": [p.dict() for p in products]}


@router.get("/categories")
async def get_categories():
    """Obtiene todas las categorías disponibles"""
    categories = product_service.get_categories()
    return {"categories": categories}


@router.get("/catalog")
async def get_catalog():
    """Obtiene catálogo organizado por categorías"""
    catalog = product_service.get_product_catalog()
    return {
        cat: [p.dict() for p in products] for cat, products in catalog.items()
    }


@router.get("/search")
async def search_products(
    q: Optional[str] = Query(None, description="Texto de búsqueda"),
    category: Optional[str] = Query(None, description="Categoría"),
    min_price: Optional[float] = Query(None, description="Precio mínimo"),
    max_price: Optional[float] = Query(None, description="Precio máximo"),
    labels: Optional[str] = Query(None, description="Labels separadas por coma"),
    store: Optional[str] = Query(None, description="Tienda"),
):
    """
    Busca productos con múltiples filtros

    Ejemplo: /api/products/search?q=leche&category=dairy&max_price=2000&labels=local,organic
    """
    labels_list = labels.split(",") if labels else None

    results = product_service.search_products(
        query=q or "",
        category=category,
        min_price=min_price,
        max_price=max_price,
        labels=labels_list,
        store=store,
    )

    return {
        "count": len(results),
        "query": {
            "text": q,
            "category": category,
            "min_price": min_price,
            "max_price": max_price,
            "labels": labels_list,
            "store": store,
        },
        "results": [p.dict() for p in results],
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Obtiene un producto específico por ID"""
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.dict()


@router.get("/{product_id}/analyze")
async def analyze_product(product_id: str):
    """
    Analiza un producto completo con:
    - Score de sostenibilidad
    - Alternativas
    - Potencial de ahorro
    - Recomendaciones
    """
    analysis = product_service.analyze_product(product_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Product not found")
    return analysis.dict()


@router.get("/barcode/{barcode}")
async def get_product_by_barcode(barcode: str, use_external: bool = False):
    """
    Busca un producto por código de barras

    Args:
        barcode: Código de barras del producto
        use_external: Si True, intenta buscar en Open Food Facts si no existe localmente
    """
    # Buscar en base de datos local
    product = product_service.get_product_by_barcode(barcode)

    if product:
        return {
            "source": "local",
            "product": product.dict(),
        }

    # Si no existe y use_external=True, buscar en API externa
    if use_external:
        external_product = await external_api_service.fetch_product_from_barcode(barcode)
        if external_product:
            return {
                "source": "external_api",
                "product": external_product,
                "note": "Este producto viene de Open Food Facts. Precio y disponibilidad no verificados.",
            }

    raise HTTPException(
        status_code=404,
        detail=f"Product with barcode {barcode} not found. Try use_external=true to search in external databases.",
    )


@router.post("/compare")
async def compare_products(product_ids: List[str]):
    """
    Compara múltiples productos

    Body:
    ```json
    ["prod_001", "prod_002", "prod_003"]
    ```
    """
    if len(product_ids) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 products to compare")

    comparison = product_service.compare_products(product_ids)

    if "error" in comparison:
        raise HTTPException(status_code=400, detail=comparison["error"])

    return comparison


@router.get("/{product_id}/carbon-footprint")
async def get_carbon_footprint(product_id: str):
    """Calcula la huella de carbono estimada de un producto"""
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Si ya tiene carbon footprint, retornarlo
    if product.sustainability and product.sustainability.carbon_footprint_kg:
        return {
            "product_id": product_id,
            "product_name": product.name,
            "carbon_footprint_kg": product.sustainability.carbon_footprint_kg,
            "source": "product_data",
        }

    # Sino, estimarlo
    estimation = await external_api_service.estimate_carbon_footprint(
        product.category, product.quantity
    )

    return {
        "product_id": product_id,
        "product_name": product.name,
        **estimation,
        "source": "estimated",
    }


@router.get("/external/search")
async def search_external_api(q: str, country: str = "chile"):
    """
    Busca productos en Open Food Facts API

    Útil para descubrir nuevos productos no en el catálogo local
    """
    results = await external_api_service.search_products_open_food_facts(q, country)

    return {
        "query": q,
        "country": country,
        "count": len(results),
        "source": "Open Food Facts",
        "results": results,
    }
