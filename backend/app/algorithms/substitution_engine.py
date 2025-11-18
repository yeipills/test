"""
ALGORITMO 3: Motor de Sustitución Inteligente de Productos
Encuentra sustitutos óptimos para productos basándose en:
- Similitud de categoría y características
- Mejora en precio/sostenibilidad/salud
- Compatibilidad con preferencias del usuario
- Análisis de trade-offs (ventajas vs desventajas)

Implementación: Algoritmo de scoring multi-dimensional con similarity matching
"""

from typing import List, Tuple, Optional, Dict
import math
from ..models.product import Product
from ..models.recommendation import SubstitutionSuggestion
from .sustainability_scorer import SustainabilityScorer


class IntelligentSubstitutionEngine:
    """
    Motor inteligente para sugerencia de sustituciones de productos
    Encuentra alternativas mejores basándose en criterios múltiples
    """

    def __init__(
        self,
        sustainability_scorer: Optional[SustainabilityScorer] = None,
        similarity_threshold: float = 0.3,  # Mínimo de similitud para considerar sustituto
    ):
        self.scorer = sustainability_scorer or SustainabilityScorer()
        self.similarity_threshold = similarity_threshold

        # Pesos para diferentes tipos de sustitución
        self.substitution_weights = {
            "price_focused": {"price": 0.5, "sustainability": 0.2, "health": 0.2, "similarity": 0.1},
            "sustainability_focused": {"price": 0.15, "sustainability": 0.5, "health": 0.2, "similarity": 0.15},
            "health_focused": {"price": 0.15, "sustainability": 0.2, "health": 0.5, "similarity": 0.15},
            "balanced": {"price": 0.25, "sustainability": 0.25, "health": 0.25, "similarity": 0.25},
        }

    def find_substitutions(
        self,
        original_product: Product,
        candidate_products: List[Product],
        focus: str = "balanced",
        max_suggestions: int = 5,
    ) -> List[SubstitutionSuggestion]:
        """
        Encuentra las mejores sustituciones para un producto

        Args:
            original_product: Producto original a sustituir
            candidate_products: Lista de productos candidatos
            focus: Enfoque de sustitución (price_focused, sustainability_focused, health_focused, balanced)
            max_suggestions: Número máximo de sugerencias

        Returns:
            Lista de SubstitutionSuggestion ordenadas por score
        """
        suggestions = []
        weights = self.substitution_weights.get(focus, self.substitution_weights["balanced"])

        # Calcular score del producto original
        original_score = self.scorer.calculate_score(original_product)

        for candidate in candidate_products:
            # No sugerir el mismo producto
            if candidate.id == original_product.id:
                continue

            # Calcular similitud
            similarity = self._calculate_similarity(original_product, candidate)

            # Filtrar productos muy diferentes
            if similarity < self.similarity_threshold:
                continue

            # Calcular score del candidato
            candidate_score = self.scorer.calculate_score(candidate)

            # Calcular diferencias
            price_diff = original_product.price - candidate.price
            price_diff_pct = (price_diff / original_product.price) * 100

            sustainability_improvement = (
                candidate_score.overall_score - original_score.overall_score
            )
            health_improvement = candidate_score.health_score - original_score.health_score

            # Calcular score de sustitución
            substitution_score = self._calculate_substitution_score(
                price_diff_pct=price_diff_pct,
                sustainability_improvement=sustainability_improvement,
                health_improvement=health_improvement,
                similarity=similarity,
                weights=weights,
            )

            # Generar razones y trade-offs
            reasons, trade_offs = self._generate_reasons_and_tradeoffs(
                original_product,
                candidate,
                original_score,
                candidate_score,
                price_diff,
                price_diff_pct,
            )

            # Determinar tipo de sustitución
            substitution_type = self._determine_substitution_type(
                original_product, candidate, similarity
            )

            # Determinar confianza
            confidence = self._determine_confidence(similarity, substitution_score)

            suggestion = SubstitutionSuggestion(
                original_product=original_product,
                suggested_product=candidate,
                substitution_score=round(substitution_score, 2),
                price_difference=round(price_diff, 2),
                price_difference_percentage=round(price_diff_pct, 2),
                sustainability_improvement=round(sustainability_improvement, 2),
                health_improvement=round(health_improvement, 2),
                reasons=reasons,
                trade_offs=trade_offs,
                substitution_type=substitution_type,
                confidence=confidence,
            )

            suggestions.append(suggestion)

        # Ordenar por score de sustitución
        suggestions.sort(key=lambda s: s.substitution_score, reverse=True)

        return suggestions[:max_suggestions]

    def _calculate_similarity(self, product1: Product, product2: Product) -> float:
        """
        Calcula similitud entre dos productos (0-1)
        Considera: categoría, ingredientes, labels, valores nutricionales
        """
        similarity_score = 0.0
        components = 0

        # 1. Categoría exacta (peso alto)
        if product1.category == product2.category:
            similarity_score += 0.4
        elif self._similar_category(product1.category, product2.category):
            similarity_score += 0.2
        components += 0.4

        # 2. Similitud de marca
        if product1.brand and product2.brand:
            if product1.brand == product2.brand:
                similarity_score += 0.1
            components += 0.1

        # 3. Labels comunes (orgánico, vegano, etc.)
        if product1.labels and product2.labels:
            labels1 = set(label.lower() for label in product1.labels)
            labels2 = set(label.lower() for label in product2.labels)
            if labels1 and labels2:
                label_overlap = len(labels1 & labels2) / len(labels1 | labels2)
                similarity_score += label_overlap * 0.2
            components += 0.2

        # 4. Similitud nutricional
        if product1.nutrition and product2.nutrition:
            nutrition_similarity = self._calculate_nutrition_similarity(
                product1.nutrition, product2.nutrition
            )
            similarity_score += nutrition_similarity * 0.15
            components += 0.15

        # 5. Rango de precio similar
        price_ratio = min(product1.price, product2.price) / max(product1.price, product2.price)
        if price_ratio >= 0.7:  # Precios dentro del 30% de diferencia
            similarity_score += 0.15
        components += 0.15

        # Normalizar
        return similarity_score / components if components > 0 else 0

    def _similar_category(self, cat1: str, cat2: str) -> bool:
        """Verifica si dos categorías son similares"""
        # Mapeo de categorías similares
        similar_groups = [
            {"dairy", "milk", "yogurt", "cheese"},
            {"fruit", "fruits", "fresh_fruit"},
            {"vegetable", "vegetables", "fresh_vegetables"},
            {"meat", "poultry", "beef", "chicken"},
            {"bread", "bakery", "cereals"},
            {"beverages", "drinks", "juice", "soda"},
        ]

        cat1_lower = cat1.lower()
        cat2_lower = cat2.lower()

        for group in similar_groups:
            if cat1_lower in group and cat2_lower in group:
                return True

        return False

    def _calculate_nutrition_similarity(self, nutr1, nutr2) -> float:
        """Calcula similitud entre perfiles nutricionales"""
        if not nutr1 or not nutr2:
            return 0

        # Comparar macronutrientes principales
        metrics = ["energy_kcal", "proteins", "carbohydrates", "fats", "fiber"]
        similarities = []

        for metric in metrics:
            val1 = getattr(nutr1, metric, 0) or 0
            val2 = getattr(nutr2, metric, 0) or 0

            if val1 == 0 and val2 == 0:
                continue

            max_val = max(val1, val2)
            if max_val > 0:
                similarity = 1 - abs(val1 - val2) / max_val
                similarities.append(similarity)

        return sum(similarities) / len(similarities) if similarities else 0

    def _calculate_substitution_score(
        self,
        price_diff_pct: float,
        sustainability_improvement: float,
        health_improvement: float,
        similarity: float,
        weights: Dict[str, float],
    ) -> float:
        """
        Calcula score final de sustitución (0-100)
        """
        # Normalizar componentes a 0-100
        # Precio: ahorro positivo = mejor score
        price_score = min(100, max(0, 50 + price_diff_pct))  # 50 = neutral

        # Sostenibilidad: mejora directa
        sustainability_score = min(100, max(0, 50 + sustainability_improvement))

        # Salud: mejora directa
        health_score = min(100, max(0, 50 + health_improvement))

        # Similitud: convertir a score
        similarity_score = similarity * 100

        # Score ponderado
        final_score = (
            weights["price"] * price_score
            + weights["sustainability"] * sustainability_score
            + weights["health"] * health_score
            + weights["similarity"] * similarity_score
        )

        return final_score

    def _generate_reasons_and_tradeoffs(
        self,
        original: Product,
        candidate: Product,
        original_score,
        candidate_score,
        price_diff: float,
        price_diff_pct: float,
    ) -> Tuple[List[str], List[str]]:
        """Genera razones para la sustitución y posibles trade-offs"""
        reasons = []
        trade_offs = []

        # Razones positivas
        if price_diff > 0:
            if price_diff_pct > 20:
                reasons.append(f"Ahorro significativo: ${abs(price_diff):.0f} ({abs(price_diff_pct):.1f}%)")
            elif price_diff_pct > 5:
                reasons.append(f"Ahorro de ${abs(price_diff):.0f}")

        if candidate_score.environmental_score > original_score.environmental_score + 10:
            reasons.append("Mayor sostenibilidad ambiental")

        if candidate_score.health_score > original_score.health_score + 10:
            reasons.append("Mejor perfil nutricional")

        if candidate.sustainability and candidate.sustainability.local_product:
            if not (original.sustainability and original.sustainability.local_product):
                reasons.append("Producto local")

        if candidate.sustainability and candidate.sustainability.packaging_recyclable:
            if not (original.sustainability and original.sustainability.packaging_recyclable):
                reasons.append("Empaque reciclable")

        # Trade-offs
        if price_diff < 0:
            trade_offs.append(f"Costo adicional de ${abs(price_diff):.0f}")

        if candidate_score.health_score < original_score.health_score - 10:
            trade_offs.append("Menor calidad nutricional")

        if original.brand and candidate.brand and original.brand != candidate.brand:
            trade_offs.append(f"Cambio de marca (de {original.brand} a {candidate.brand})")

        if candidate.quantity < original.quantity:
            trade_offs.append("Menor cantidad por unidad")

        # Razones genéricas si no hay específicas
        if not reasons:
            reasons.append("Alternativa similar con mejor balance")

        return reasons, trade_offs

    def _determine_substitution_type(
        self, original: Product, candidate: Product, similarity: float
    ) -> str:
        """Determina el tipo de sustitución"""
        if original.name.lower() == candidate.name.lower() and original.brand != candidate.brand:
            return "same_product_different_brand"
        elif similarity > 0.7:
            return "similar_category"
        else:
            return "healthier_alternative"

    def _determine_confidence(self, similarity: float, substitution_score: float) -> str:
        """Determina el nivel de confianza de la sustitución"""
        # Alta confianza: alta similitud y buen score
        if similarity >= 0.7 and substitution_score >= 70:
            return "high"
        # Baja confianza: baja similitud o score bajo
        elif similarity < 0.4 or substitution_score < 50:
            return "low"
        else:
            return "medium"

    def batch_substitute(
        self,
        products: List[Product],
        product_catalog: List[Product],
        focus: str = "balanced",
    ) -> Dict[str, List[SubstitutionSuggestion]]:
        """
        Encuentra sustituciones para múltiples productos simultáneamente

        Returns:
            Dict de product_id -> lista de sugerencias
        """
        results = {}

        for product in products:
            # Filtrar candidatos de la misma categoría
            candidates = [
                p for p in product_catalog if p.category == product.category and p.id != product.id
            ]

            suggestions = self.find_substitutions(product, candidates, focus=focus)
            if suggestions:
                results[product.id] = suggestions

        return results

    def get_best_substitute(
        self, original_product: Product, candidate_products: List[Product], focus: str = "balanced"
    ) -> Optional[SubstitutionSuggestion]:
        """
        Obtiene la mejor sustitución única para un producto

        Returns:
            La mejor SubstitutionSuggestion o None
        """
        suggestions = self.find_substitutions(
            original_product, candidate_products, focus=focus, max_suggestions=1
        )

        return suggestions[0] if suggestions else None
