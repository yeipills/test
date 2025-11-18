"""
Rutas de API para recomendaciones y sustituciones inteligentes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services.product_service import ProductService
from ..algorithms import IntelligentSubstitutionEngine, SustainabilityScorer

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# Servicios
product_service = ProductService()
scorer = SustainabilityScorer()
substitution_engine = IntelligentSubstitutionEngine(scorer)


@router.get("/substitute/{product_id}")
async def get_substitutions(
    product_id: str,
    focus: str = Query("balanced", description="price_focused, sustainability_focused, health_focused, balanced"),
    max_results: int = Query(5, ge=1, le=10),
):
    """
    Obtiene sugerencias de sustitución para un producto

    Implementa el ALGORITMO DE SUSTITUCIÓN INTELIGENTE

    Args:
        product_id: ID del producto a sustituir
        focus: Enfoque de sustitución
        max_results: Número máximo de sugerencias

    Returns:
        Lista de SubstitutionSuggestion ordenadas por score
    """
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Obtener productos de la misma categoría
    category_products = product_service.get_products_by_category(product.category)

    if len(category_products) < 2:
        return {
            "original_product": product.dict(),
            "suggestions": [],
            "message": "No alternative products available in this category",
        }

    # Generar sustituciones
    suggestions = substitution_engine.find_substitutions(
        product,
        category_products,
        focus=focus,
        max_suggestions=max_results,
    )

    return {
        "original_product": product.dict(),
        "focus": focus,
        "suggestions": [s.dict() for s in suggestions],
        "count": len(suggestions),
    }


@router.post("/batch-substitute")
async def batch_substitute(
    product_ids: List[str],
    focus: str = "balanced",
):
    """
    Obtiene sustituciones para múltiples productos simultáneamente

    Body ejemplo:
    ```json
    {
      "product_ids": ["prod_001", "prod_003", "prod_005"],
      "focus": "sustainability_focused"
    }
    ```
    """
    products = [product_service.get_product_by_id(pid) for pid in product_ids]
    products = [p for p in products if p is not None]

    if not products:
        raise HTTPException(status_code=404, detail="No valid products found")

    catalog = product_service.get_all_products()

    results = substitution_engine.batch_substitute(products, catalog, focus=focus)

    # Convertir a formato serializable
    serialized_results = {}
    for product_id, suggestions in results.items():
        serialized_results[product_id] = [s.dict() for s in suggestions]

    return {
        "focus": focus,
        "products_analyzed": len(products),
        "substitutions_found": len(results),
        "results": serialized_results,
    }


@router.get("/similar/{product_id}")
async def get_similar_products(
    product_id: str,
    limit: int = Query(5, ge=1, le=20),
):
    """
    Encuentra productos similares basados en categoría, labels y características

    Diferente a substitute: no busca necesariamente mejores opciones,
    solo productos similares
    """
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Buscar en la misma categoría
    similar = product_service.get_products_by_category(product.category)

    # Filtrar el mismo producto
    similar = [p for p in similar if p.id != product_id]

    # Si tiene labels, priorizar productos con labels similares
    if product.labels:
        # Calcular overlap de labels
        def label_similarity(p):
            if not p.labels:
                return 0
            common = len(set(product.labels) & set(p.labels))
            return common

        similar.sort(key=label_similarity, reverse=True)

    return {
        "original_product": product.dict(),
        "similar_products": [p.dict() for p in similar[:limit]],
        "count": len(similar[:limit]),
    }


@router.get("/top-sustainable")
async def get_top_sustainable_products(
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Retorna los productos con mejor score de sostenibilidad

    Args:
        category: Filtrar por categoría (opcional)
        limit: Número de productos a retornar
    """
    if category:
        products = product_service.get_products_by_category(category)
    else:
        products = product_service.get_all_products()

    if not products:
        return {"products": [], "count": 0}

    # Rankear por sostenibilidad
    ranked = scorer.rank_products(products)

    # Tomar top N
    top_products = ranked[:limit]

    return {
        "category": category or "all",
        "count": len(top_products),
        "products": [
            {
                "product": p.dict(),
                "sustainability_score": s.dict(),
                "rank": i + 1,
            }
            for i, (p, s) in enumerate(top_products)
        ],
    }


@router.get("/best-value")
async def get_best_value_products(
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Retorna productos con mejor relación calidad-precio-sostenibilidad

    Combina bajo precio con alta sostenibilidad
    """
    if category:
        products = product_service.get_products_by_category(category)
    else:
        products = product_service.get_all_products()

    if not products:
        return {"products": [], "count": 0}

    # Calcular "value score" para cada producto
    scored_products = []
    for product in products:
        sus_score = scorer.calculate_score(product)

        # Value score = sostenibilidad / (precio normalizado)
        # Mayor sostenibilidad y menor precio = mejor value
        price_normalized = product.price / 1000  # Normalizar precio
        value_score = sus_score.overall_score / (1 + price_normalized)

        scored_products.append((product, sus_score, value_score))

    # Ordenar por value score
    scored_products.sort(key=lambda x: x[2], reverse=True)

    return {
        "category": category or "all",
        "count": len(scored_products[:limit]),
        "products": [
            {
                "product": p.dict(),
                "sustainability_score": s.dict(),
                "value_score": round(v, 2),
                "rank": i + 1,
            }
            for i, (p, s, v) in enumerate(scored_products[:limit])
        ],
    }


@router.get("/savings-opportunities")
async def get_savings_opportunities(min_savings_percentage: float = 10.0):
    """
    Identifica oportunidades de ahorro: productos caros que tienen alternativas más baratas y sostenibles

    Retorna pares de (producto_caro, alternativa_mejor)
    """
    opportunities = []

    for category in product_service.get_categories():
        products = product_service.get_products_by_category(category)

        if len(products) < 2:
            continue

        # Para cada producto, encontrar mejor sustituto
        for product in products:
            alternatives = [p for p in products if p.id != product.id]
            suggestions = substitution_engine.find_substitutions(
                product,
                alternatives,
                focus="price_focused",
                max_suggestions=1,
            )

            if suggestions:
                best_sub = suggestions[0]
                # Solo incluir si hay ahorro significativo
                if best_sub.price_difference_percentage >= min_savings_percentage:
                    opportunities.append({
                        "expensive_product": product.dict(),
                        "better_alternative": best_sub.suggested_product.dict(),
                        "savings": best_sub.price_difference,
                        "savings_percentage": best_sub.price_difference_percentage,
                        "sustainability_improvement": best_sub.sustainability_improvement,
                    })

    # Ordenar por ahorro
    opportunities.sort(key=lambda x: x["savings"], reverse=True)

    return {
        "count": len(opportunities),
        "total_potential_savings": round(sum(o["savings"] for o in opportunities), 2),
        "opportunities": opportunities[:20],  # Top 20
    }
