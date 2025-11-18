"""
ALGORITMO 1: Sistema de Scoring de Sostenibilidad Multi-dimensional
Calcula puntuaciones de sostenibilidad considerando:
- Impacto económico (precio, relación calidad-precio)
- Impacto ambiental (huella de carbono, uso de agua, packaging)
- Impacto social (comercio justo, producción local)
- Salud nutricional (calidad nutricional, aditivos)
"""

import math
from typing import Dict, List, Optional
from ..models.product import Product, SustainabilityScore, NutritionInfo


class SustainabilityScorer:
    """
    Sistema de scoring multi-criterio para sostenibilidad de productos
    Usa ponderaciones configurables y normalización min-max
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        price_reference: float = 5000.0,  # precio de referencia en CLP
    ):
        # Pesos por defecto para cada dimensión (deben sumar 1.0)
        self.weights = weights or {
            "economic": 0.30,
            "environmental": 0.30,
            "social": 0.20,
            "health": 0.20,
        }
        self.price_reference = price_reference

        # Rangos de referencia para normalización
        self.carbon_reference = 5.0  # kg CO2 promedio
        self.water_reference = 100.0  # litros promedio

    def calculate_score(self, product: Product) -> SustainabilityScore:
        """
        Calcula el score de sostenibilidad completo para un producto

        Returns:
            SustainabilityScore con todas las dimensiones calculadas
        """
        economic_score = self._calculate_economic_score(product)
        environmental_score = self._calculate_environmental_score(product)
        social_score = self._calculate_social_score(product)
        health_score = self._calculate_health_score(product)

        # Score general ponderado
        overall_score = (
            economic_score * self.weights["economic"]
            + environmental_score * self.weights["environmental"]
            + social_score * self.weights["social"]
            + health_score * self.weights["health"]
        )

        return SustainabilityScore(
            economic_score=round(economic_score, 2),
            environmental_score=round(environmental_score, 2),
            social_score=round(social_score, 2),
            health_score=round(health_score, 2),
            overall_score=round(overall_score, 2),
            carbon_footprint_kg=getattr(
                product.sustainability, "carbon_footprint_kg", None
            )
            if product.sustainability
            else None,
            water_usage_liters=getattr(
                product.sustainability, "water_usage_liters", None
            )
            if product.sustainability
            else None,
            packaging_recyclable=getattr(
                product.sustainability, "packaging_recyclable", False
            )
            if product.sustainability
            else False,
            fair_trade=getattr(product.sustainability, "fair_trade", False)
            if product.sustainability
            else False,
            local_product=getattr(product.sustainability, "local_product", False)
            if product.sustainability
            else False,
        )

    def _calculate_economic_score(self, product: Product) -> float:
        """
        Score económico basado en precio y valor por dinero
        Menor precio = mayor score
        """
        # Normalizar precio (invertido: precio bajo = score alto)
        price_score = 100 * (1 - min(product.price / (self.price_reference * 2), 1.0))

        # Ajustar por cantidad (valor por dinero)
        value_score = 50.0
        if product.quantity and product.quantity > 1:
            value_score = min(100, 50 + (product.quantity * 10))

        return (price_score * 0.7) + (value_score * 0.3)

    def _calculate_environmental_score(self, product: Product) -> float:
        """
        Score ambiental basado en huella de carbono, agua y packaging
        """
        score = 50.0  # Score base neutral

        if not product.sustainability:
            return score

        # Huella de carbono (menor es mejor)
        if product.sustainability.carbon_footprint_kg is not None:
            carbon_ratio = product.sustainability.carbon_footprint_kg / self.carbon_reference
            carbon_score = 100 * (1 - min(carbon_ratio, 1.0))
            score += (carbon_score - 50) * 0.4

        # Uso de agua (menor es mejor)
        if product.sustainability.water_usage_liters is not None:
            water_ratio = product.sustainability.water_usage_liters / self.water_reference
            water_score = 100 * (1 - min(water_ratio, 1.0))
            score += (water_score - 50) * 0.3

        # Packaging reciclable (+20 puntos)
        if product.sustainability.packaging_recyclable:
            score += 15

        # Labels ecológicas
        if product.labels:
            eco_labels = ["organic", "eco", "sustainable", "recycled"]
            eco_count = sum(
                1 for label in product.labels if any(eco in label.lower() for eco in eco_labels)
            )
            score += min(eco_count * 5, 15)

        return max(0, min(100, score))

    def _calculate_social_score(self, product: Product) -> float:
        """
        Score social basado en comercio justo, producción local, certificaciones
        """
        score = 50.0  # Score base neutral

        if not product.sustainability:
            return score

        # Comercio justo (+25 puntos)
        if product.sustainability.fair_trade:
            score += 25

        # Producto local (+25 puntos)
        if product.sustainability.local_product:
            score += 25

        # Certificaciones sociales
        if product.labels:
            social_labels = ["fair trade", "local", "artisan", "cooperative", "ethical"]
            social_count = sum(
                1
                for label in product.labels
                if any(social in label.lower() for social in social_labels)
            )
            score += min(social_count * 10, 20)

        return max(0, min(100, score))

    def _calculate_health_score(self, product: Product) -> float:
        """
        Score de salud basado en información nutricional y aditivos
        Usa el sistema Nutri-Score simplificado
        """
        if not product.nutrition:
            return 50.0  # Score neutral si no hay info nutricional

        score = 70.0  # Score base bueno

        nutrition = product.nutrition

        # Penalizar alto contenido de grasas saturadas, azúcar, sal
        if nutrition.fats and nutrition.fats > 10:
            score -= min((nutrition.fats - 10) * 2, 20)

        if nutrition.salt and nutrition.salt > 1:
            score -= min((nutrition.salt - 1) * 15, 25)

        # Bonificar proteínas y fibra
        if nutrition.proteins and nutrition.proteins > 5:
            score += min(nutrition.proteins * 2, 15)

        if nutrition.fiber and nutrition.fiber > 3:
            score += min(nutrition.fiber * 3, 15)

        # Labels saludables
        if product.labels:
            health_labels = ["organic", "whole grain", "low fat", "no sugar", "vegan", "vegetarian"]
            health_count = sum(
                1
                for label in product.labels
                if any(health in label.lower() for health in health_labels)
            )
            score += min(health_count * 5, 15)

        # Penalizar alérgenos múltiples
        if product.allergens and len(product.allergens) > 3:
            score -= 10

        return max(0, min(100, score))

    def compare_products(self, product1: Product, product2: Product) -> Dict:
        """
        Compara dos productos en todas las dimensiones de sostenibilidad
        """
        score1 = self.calculate_score(product1)
        score2 = self.calculate_score(product2)

        return {
            "product1": {
                "name": product1.name,
                "scores": score1.dict(),
            },
            "product2": {
                "name": product2.name,
                "scores": score2.dict(),
            },
            "winner": product1.name if score1.overall_score > score2.overall_score else product2.name,
            "score_difference": abs(score1.overall_score - score2.overall_score),
            "dimension_comparison": {
                "economic": score1.economic_score - score2.economic_score,
                "environmental": score1.environmental_score - score2.environmental_score,
                "social": score1.social_score - score2.social_score,
                "health": score1.health_score - score2.health_score,
            },
        }

    def rank_products(self, products: List[Product]) -> List[tuple[Product, SustainabilityScore]]:
        """
        Rankea una lista de productos por su score de sostenibilidad

        Returns:
            Lista de tuplas (Product, SustainabilityScore) ordenada de mejor a peor
        """
        scored_products = [(p, self.calculate_score(p)) for p in products]
        return sorted(scored_products, key=lambda x: x[1].overall_score, reverse=True)
