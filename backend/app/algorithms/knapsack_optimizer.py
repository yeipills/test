"""
ALGORITMO: Optimizador de Lista de Compras Multi-objetivo

Lógica correcta:
1. Para cada item, encontrar productos candidatos
2. Seleccionar la mejor variante según el objetivo (precio/sostenibilidad/salud)
3. Si el costo excede el presupuesto, excluir items de baja prioridad
4. Calcular ahorro real (costo sin optimizar vs optimizado)
"""

from typing import List, Dict, Tuple, Optional
from ..models.product import Product, SustainabilityScore
from ..models.shopping_list import ShoppingListItem, ShoppingList, OptimizedProduct, OptimizedShoppingList
from .sustainability_scorer import SustainabilityScorer


class MultiObjectiveKnapsackOptimizer:
    """
    Optimizador de listas de compras con restricción de presupuesto real
    """

    def __init__(self, sustainability_scorer: Optional[SustainabilityScorer] = None):
        self.scorer = sustainability_scorer or SustainabilityScorer()

    def optimize(
        self,
        shopping_list: ShoppingList,
        available_products: Dict[str, List[Product]],
    ) -> OptimizedShoppingList:
        """
        Optimiza una lista de compras respetando el presupuesto
        """
        items = shopping_list.items
        budget = shopping_list.budget or float('inf')
        optimize_for = shopping_list.optimize_for

        # Fase 1: Encontrar candidatos para cada item
        item_candidates: List[Tuple[ShoppingListItem, List[Product]]] = []
        items_not_found = []
        warnings = []

        for item in items:
            candidates = self._find_candidate_products(item, available_products)
            if candidates:
                item_candidates.append((item, candidates))
            else:
                items_not_found.append(item.product_name)
                warnings.append(f"No se encontraron productos para '{item.product_name}'")

        if not item_candidates:
            result = self._create_empty_result(shopping_list)
            result.warnings = warnings
            result.items_not_found = items_not_found
            return result

        # Fase 2: Seleccionar mejor variante para cada item
        selections = []
        for item, candidates in item_candidates:
            best_product = self._select_best_product(item, candidates, optimize_for)
            default_product = self._get_default_product(candidates)  # Para calcular ahorro
            selections.append((item, candidates, best_product, default_product))

        # Fase 3: Ajustar al presupuesto (excluir items de baja prioridad)
        if budget < float('inf'):
            selections = self._fit_to_budget(selections, budget)

        # Fase 4: Construir resultado
        result = self._build_result(shopping_list, selections, budget)
        result.warnings = warnings
        result.items_not_found = items_not_found

        return result

    def _find_candidate_products(
        self, item: ShoppingListItem, available_products: Dict[str, List[Product]]
    ) -> List[Product]:
        """Encuentra productos candidatos que coincidan con el item"""
        candidates = []
        name_matches = []
        search_name = (item.product_name or "").lower().strip()

        category_products = available_products.get(item.category, [])

        for product in category_products:
            # Filtrar por precio máximo
            if item.max_price and product.price > item.max_price:
                continue

            # Filtrar por preferencias
            if item.preferences and not self._matches_preferences(product, item.preferences):
                continue

            # Priorizar por coincidencia de nombre
            if search_name:
                product_name_lower = product.name.lower()
                if search_name in product_name_lower or product_name_lower in search_name:
                    name_matches.append(product)
                else:
                    candidates.append(product)
            else:
                candidates.append(product)

        # Priorizar matches por nombre
        return name_matches + candidates if name_matches else candidates

    def _matches_preferences(self, product: Product, preferences: List[str]) -> bool:
        """Verifica si un producto cumple con las preferencias"""
        if not preferences:
            return True
        product_labels = [label.lower() for label in (product.labels or [])]
        matches = sum(1 for pref in preferences if pref.lower() in product_labels)
        return matches >= len(preferences) * 0.5

    def _select_best_product(
        self, item: ShoppingListItem, candidates: List[Product], optimize_for: str
    ) -> Product:
        """Selecciona el mejor producto según el objetivo de optimización"""
        if not candidates:
            return None

        if optimize_for == "price":
            # Menor precio
            return min(candidates, key=lambda p: p.price)

        elif optimize_for == "sustainability":
            # Mayor score de sostenibilidad
            return max(candidates, key=lambda p: self.scorer.calculate_score(p).overall_score)

        elif optimize_for == "health":
            # Mayor score de salud
            return max(candidates, key=lambda p: self.scorer.calculate_score(p).health_score)

        else:  # balanced
            # Score combinado: precio + sostenibilidad
            def balanced_score(p):
                sus = self.scorer.calculate_score(p)
                # Normalizar precio (inverso, menor es mejor)
                max_price = max(c.price for c in candidates)
                min_price = min(c.price for c in candidates)
                if max_price == min_price:
                    price_score = 100
                else:
                    price_score = 100 * (1 - (p.price - min_price) / (max_price - min_price))
                # Combinar 40% precio + 40% sostenibilidad + 20% salud
                return 0.4 * price_score + 0.4 * sus.overall_score + 0.2 * sus.health_score

            return max(candidates, key=balanced_score)

    def _get_default_product(self, candidates: List[Product]) -> Product:
        """Obtiene el producto por defecto (primero/más común) para calcular ahorro"""
        if not candidates:
            return None
        # El primero es el que más coincide con el nombre buscado
        return candidates[0]

    def _fit_to_budget(
        self,
        selections: List[Tuple[ShoppingListItem, List[Product], Product, Product]],
        budget: float
    ) -> List[Tuple[ShoppingListItem, List[Product], Product, Product]]:
        """
        Ajusta la selección al presupuesto usando algoritmo greedy.
        Primero intenta variantes más baratas, luego excluye items.
        """
        # Paso 1: Usar variantes más baratas para todos los items
        cheap_selections = []
        for item, candidates, best, default in selections:
            if candidates:
                cheapest = min(candidates, key=lambda p: p.price)
                cheap_selections.append((item, candidates, cheapest, default))
            else:
                cheap_selections.append((item, candidates, best, default))

        # Calcular costo con variantes baratas
        total_cost = sum(sel[2].price * sel[0].quantity for sel in cheap_selections if sel[2])

        if total_cost <= budget:
            # Cabe todo con variantes baratas, ahora optimizar según objetivo original
            return selections if sum(s[2].price * s[0].quantity for s in selections if s[2]) <= budget else cheap_selections

        # Paso 2: Ordenar por prioridad y costo (excluir opcionales caros primero)
        sorted_selections = sorted(
            cheap_selections,
            key=lambda s: (-s[0].priority, s[2].price * s[0].quantity if s[2] else 0)
        )

        # Paso 3: Incluir items hasta llenar presupuesto (knapsack greedy)
        included = []
        current_cost = 0

        # Ordenar por valor (prioridad) / peso (costo) - ratio de eficiencia
        def efficiency_ratio(sel):
            item, _, product, _ = sel
            if not product:
                return 0
            cost = product.price * item.quantity
            if cost == 0:
                return float('inf')
            # Mayor prioridad (menor número) = más valor
            value = 6 - item.priority  # Convertir 1-5 a 5-1
            return value / cost

        sorted_by_efficiency = sorted(cheap_selections, key=efficiency_ratio, reverse=True)

        for sel in sorted_by_efficiency:
            item, candidates, product, default = sel
            if product:
                item_cost = product.price * item.quantity
                if current_cost + item_cost <= budget:
                    current_cost += item_cost
                    included.append(sel)

        return included

    def _optimize_essentials_for_budget(
        self,
        essential_selections: List[Tuple[ShoppingListItem, List[Product], Product, Product]],
        budget: float
    ) -> List[Tuple[ShoppingListItem, List[Product], Product, Product]]:
        """
        Si los esenciales exceden el presupuesto, elegir las variantes más baratas
        """
        optimized = []
        for item, candidates, best, default in essential_selections:
            # Elegir el más barato
            cheapest = min(candidates, key=lambda p: p.price) if candidates else best
            optimized.append((item, candidates, cheapest, default))
        return optimized

    def _build_result(
        self,
        shopping_list: ShoppingList,
        selections: List[Tuple[ShoppingListItem, List[Product], Product, Product]],
        budget: float
    ) -> OptimizedShoppingList:
        """Construye el resultado de la optimización"""
        optimized_items = []
        total_cost = 0
        total_cost_without_optimization = 0
        total_carbon = 0
        total_water = 0
        recyclable_count = 0
        sustainability_scores = []

        for item, candidates, selected, default in selections:
            if not selected:
                continue

            sus_score = self.scorer.calculate_score(selected)
            sustainability_scores.append(sus_score)

            # Calcular ahorro real (comparado con el producto por defecto)
            default_price = default.price if default else selected.price
            savings = max(0, (default_price - selected.price) * item.quantity)

            # Costo sin optimización (producto por defecto)
            total_cost_without_optimization += default_price * item.quantity

            # Alternativas (otros productos disponibles)
            alternatives = [c for c in candidates[:4] if c.id != selected.id]

            # Razón de selección
            reason = self._generate_reason(selected, sus_score, shopping_list.optimize_for)

            optimized_items.append(
                OptimizedProduct(
                    original_item=item,
                    selected_product=selected,
                    alternatives=alternatives[:3],
                    reason=reason,
                    savings=round(savings, 2),
                    sustainability_impact=self._get_impact_level(sus_score.environmental_score),
                )
            )

            # Acumular métricas
            total_cost += selected.price * item.quantity
            if sus_score.carbon_footprint_kg:
                total_carbon += sus_score.carbon_footprint_kg * item.quantity
            if sus_score.water_usage_liters:
                total_water += sus_score.water_usage_liters * item.quantity
            if sus_score.packaging_recyclable:
                recyclable_count += 1

        # Calcular sostenibilidad promedio
        if sustainability_scores:
            overall_sustainability = SustainabilityScore(
                economic_score=sum(s.economic_score for s in sustainability_scores) / len(sustainability_scores),
                environmental_score=sum(s.environmental_score for s in sustainability_scores) / len(sustainability_scores),
                social_score=sum(s.social_score for s in sustainability_scores) / len(sustainability_scores),
                health_score=sum(s.health_score for s in sustainability_scores) / len(sustainability_scores),
                overall_score=sum(s.overall_score for s in sustainability_scores) / len(sustainability_scores),
            )
        else:
            overall_sustainability = SustainabilityScore(
                economic_score=0, environmental_score=0, social_score=0, health_score=0, overall_score=0
            )

        # Ahorro total real
        total_savings = max(0, total_cost_without_optimization - total_cost)

        # Presupuesto usado
        budget_used = (total_cost / budget * 100) if budget < float('inf') else 0

        # Tiendas recomendadas
        store_counts = {}
        for opt_item in optimized_items:
            store = opt_item.selected_product.store or "Tienda General"
            store_counts[store] = store_counts.get(store, 0) + 1
        recommended_stores = sorted(store_counts.keys(), key=lambda s: store_counts[s], reverse=True)

        return OptimizedShoppingList(
            original_list=shopping_list,
            optimized_items=optimized_items,
            total_cost=round(total_cost, 2),
            estimated_savings=round(total_savings, 2),
            budget_used_percentage=round(budget_used, 2),
            overall_sustainability=overall_sustainability,
            total_carbon_footprint=round(total_carbon, 2),
            total_water_usage=round(total_water, 2),
            recyclable_percentage=round(
                (recyclable_count / len(optimized_items) * 100) if optimized_items else 0, 2
            ),
            optimization_algorithm="Smart Budget Optimizer",
            constraints_met=total_cost <= budget if budget < float('inf') else True,
            items_substituted=0,
            optimization_score=round(overall_sustainability.overall_score, 2),
            recommended_stores=recommended_stores[:3],
            estimated_shopping_time=len(recommended_stores) * 15 + len(optimized_items) * 2,
        )

    def _generate_reason(self, product: Product, sus_score: SustainabilityScore, optimize_for: str) -> str:
        """Genera razón clara de la selección"""
        if optimize_for == "price":
            return "Mejor precio disponible"
        elif optimize_for == "sustainability":
            if sus_score.overall_score >= 70:
                return "Alta sostenibilidad ambiental y social"
            return "Mejor opción sostenible disponible"
        elif optimize_for == "health":
            if sus_score.health_score >= 70:
                return "Excelente perfil nutricional"
            return "Mejor opción saludable disponible"
        else:
            return "Mejor balance precio-sostenibilidad-salud"

    def _get_impact_level(self, score: float) -> str:
        """Convierte score a nivel de impacto"""
        if score >= 75:
            return "low"
        elif score >= 50:
            return "medium"
        return "high"

    def _create_empty_result(self, shopping_list: ShoppingList) -> OptimizedShoppingList:
        """Crea resultado vacío"""
        return OptimizedShoppingList(
            original_list=shopping_list,
            optimized_items=[],
            total_cost=0,
            estimated_savings=0,
            budget_used_percentage=0,
            overall_sustainability=SustainabilityScore(
                economic_score=0, environmental_score=0, social_score=0, health_score=0, overall_score=0
            ),
            optimization_algorithm="Smart Budget Optimizer",
            constraints_met=True,
            optimization_score=0,
        )
