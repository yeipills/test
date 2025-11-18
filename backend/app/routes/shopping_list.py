"""
Rutas de API para optimización de listas de compras
"""

from fastapi import APIRouter, HTTPException
from typing import List
from ..models.shopping_list import ShoppingList, ShoppingListItem
from ..services.product_service import ProductService
from ..algorithms import MultiObjectiveKnapsackOptimizer, SustainabilityScorer

router = APIRouter(prefix="/api/shopping-list", tags=["shopping-list"])

# Servicios
product_service = ProductService()
scorer = SustainabilityScorer()
optimizer = MultiObjectiveKnapsackOptimizer(sustainability_scorer=scorer)


@router.post("/optimize")
async def optimize_shopping_list(shopping_list: ShoppingList):
    """
    Optimiza una lista de compras usando el algoritmo de mochila multi-objetivo

    Este endpoint implementa el CORE de la plataforma:
    - Algoritmo de mochila multi-objetivo
    - Optimización de presupuesto
    - Maximización de sostenibilidad
    - Balance de preferencias del usuario

    Body ejemplo:
    ```json
    {
      "items": [
        {
          "product_name": "Leche",
          "category": "dairy",
          "quantity": 2,
          "priority": 1,
          "max_price": 1500,
          "preferences": ["local", "organic"]
        }
      ],
      "budget": 20000,
      "optimize_for": "balanced"
    }
    ```

    Returns:
        OptimizedShoppingList con productos seleccionados óptimamente
    """
    # Obtener catálogo de productos disponibles
    catalog = product_service.get_product_catalog()

    if not catalog:
        raise HTTPException(status_code=500, detail="Product catalog is empty")

    # Ejecutar optimización
    try:
        result = optimizer.optimize(shopping_list, catalog)
        return result.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post("/quick-optimize")
async def quick_optimize(
    product_names: List[str],
    budget: float = None,
    optimize_for: str = "balanced"
):
    """
    Versión simplificada de optimización: solo nombres de productos

    Body ejemplo:
    ```json
    {
      "product_names": ["leche", "pan", "tomates", "arroz"],
      "budget": 10000,
      "optimize_for": "price"
    }
    ```
    """
    # Convertir nombres a items de lista
    items = []
    for name in product_names:
        # Buscar el producto
        results = product_service.search_products(query=name)
        if results:
            product = results[0]
            item = ShoppingListItem(
                product_id=product.id,
                product_name=name,
                category=product.category,
                quantity=1.0,
                priority=1,
            )
            items.append(item)

    if not items:
        raise HTTPException(status_code=404, detail="No matching products found")

    shopping_list = ShoppingList(
        items=items,
        budget=budget,
        optimize_for=optimize_for,
    )

    # Optimizar
    catalog = product_service.get_product_catalog()
    result = optimizer.optimize(shopping_list, catalog)

    return result.dict()


@router.post("/estimate")
async def estimate_shopping_list(items: List[ShoppingListItem]):
    """
    Estima costo y sostenibilidad de una lista sin optimizar

    Útil para comparar "antes y después" de la optimización
    """
    total_cost = 0
    total_items = 0
    sustainability_scores = []

    for item in items:
        # Buscar productos de la categoría
        products = product_service.get_products_by_category(item.category)

        if not products:
            continue

        # Tomar el primero (o por precio)
        if item.max_price:
            products = [p for p in products if p.price <= item.max_price]

        if products:
            product = products[0]
            cost = product.price * item.quantity
            total_cost += cost

            score = scorer.calculate_score(product)
            sustainability_scores.append(score)
            total_items += 1

    if total_items == 0:
        raise HTTPException(status_code=404, detail="No products found for items")

    avg_sustainability = sum(s.overall_score for s in sustainability_scores) / len(sustainability_scores)

    return {
        "total_cost": round(total_cost, 2),
        "total_items": total_items,
        "average_sustainability_score": round(avg_sustainability, 2),
        "breakdown": {
            "avg_economic": round(sum(s.economic_score for s in sustainability_scores) / len(sustainability_scores), 2),
            "avg_environmental": round(sum(s.environmental_score for s in sustainability_scores) / len(sustainability_scores), 2),
            "avg_social": round(sum(s.social_score for s in sustainability_scores) / len(sustainability_scores), 2),
            "avg_health": round(sum(s.health_score for s in sustainability_scores) / len(sustainability_scores), 2),
        }
    }


@router.get("/templates")
async def get_shopping_templates():
    """
    Retorna templates de listas de compras comunes

    Útil para que usuarios inicien rápido
    """
    templates = {
        "weekly_basics": {
            "name": "Compra Semanal Básica",
            "items": [
                {"product_name": "Leche", "category": "dairy", "quantity": 2, "priority": 1},
                {"product_name": "Pan", "category": "bread", "quantity": 1, "priority": 1},
                {"product_name": "Huevos", "category": "eggs", "quantity": 1, "priority": 1},
                {"product_name": "Arroz", "category": "cereals", "quantity": 1, "priority": 2},
                {"product_name": "Lentejas", "category": "legumes", "quantity": 1, "priority": 2},
                {"product_name": "Tomates", "category": "vegetable", "quantity": 1, "priority": 2},
                {"product_name": "Manzanas", "category": "fruit", "quantity": 1, "priority": 2},
            ],
            "estimated_budget": 15000,
        },
        "healthy_week": {
            "name": "Semana Saludable",
            "items": [
                {"product_name": "Yogurt Natural", "category": "dairy", "quantity": 1, "priority": 1},
                {"product_name": "Avena", "category": "cereals", "quantity": 1, "priority": 1},
                {"product_name": "Quinoa", "category": "cereals", "quantity": 1, "priority": 2},
                {"product_name": "Lentejas Orgánicas", "category": "legumes", "quantity": 1, "priority": 2},
                {"product_name": "Tomates Orgánicos", "category": "vegetable", "quantity": 1, "priority": 2},
                {"product_name": "Aceite de Oliva", "category": "oils", "quantity": 1, "priority": 1},
            ],
            "estimated_budget": 20000,
        },
        "budget_friendly": {
            "name": "Compra Económica",
            "items": [
                {"product_name": "Arroz", "category": "cereals", "quantity": 2, "priority": 1},
                {"product_name": "Lentejas", "category": "legumes", "quantity": 2, "priority": 1},
                {"product_name": "Pan", "category": "bread", "quantity": 1, "priority": 1},
                {"product_name": "Huevos", "category": "eggs", "quantity": 1, "priority": 1},
                {"product_name": "Leche", "category": "dairy", "quantity": 1, "priority": 2},
            ],
            "estimated_budget": 10000,
        },
    }

    return {"templates": templates}
