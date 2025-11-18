"""
ALGORITMO 2: Algoritmo de Mochila Multi-objetivo (Multi-objective Knapsack)
Optimiza la selección de productos considerando múltiples objetivos simultáneamente:
- Minimizar costo (restricción de presupuesto)
- Maximizar sostenibilidad ambiental
- Maximizar calidad nutricional
- Maximizar satisfacción de preferencias del usuario

Implementación: Algoritmo genético con enfoque de Pareto-optimal
"""

import random
import math
from typing import List, Dict, Tuple, Optional
from ..models.product import Product, SustainabilityScore
from ..models.shopping_list import ShoppingListItem, ShoppingList, OptimizedProduct, OptimizedShoppingList
from .sustainability_scorer import SustainabilityScorer


class MultiObjectiveKnapsackOptimizer:
    """
    Optimizador de listas de compras usando algoritmo de mochila multi-objetivo

    Este algoritmo balancea:
    1. Restricción de presupuesto (constraint)
    2. Maximización de sostenibilidad
    3. Maximización de valor/calidad
    4. Satisfacción de preferencias del usuario
    """

    def __init__(
        self,
        sustainability_scorer: Optional[SustainabilityScorer] = None,
        population_size: int = 50,
        generations: int = 100,
        mutation_rate: float = 0.15,
    ):
        self.scorer = sustainability_scorer or SustainabilityScorer()
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate

    def optimize(
        self,
        shopping_list: ShoppingList,
        available_products: Dict[str, List[Product]],
    ) -> OptimizedShoppingList:
        """
        Optimiza una lista de compras seleccionando los mejores productos

        Args:
            shopping_list: Lista de compras con items deseados
            available_products: Dict de categoría -> lista de productos disponibles

        Returns:
            OptimizedShoppingList con productos seleccionados óptimamente
        """
        # Preparar datos
        items = shopping_list.items
        budget = shopping_list.budget or float('inf')
        optimize_for = shopping_list.optimize_for

        # Configurar pesos según preferencia de optimización
        weights = self._get_optimization_weights(optimize_for)

        # Mapear items a productos candidatos
        item_candidates: List[Tuple[ShoppingListItem, List[Product]]] = []
        for item in items:
            candidates = self._find_candidate_products(item, available_products)
            if candidates:
                item_candidates.append((item, candidates))

        if not item_candidates:
            return self._create_empty_result(shopping_list)

        # Ejecutar optimización genética
        best_solution = self._genetic_algorithm(item_candidates, budget, weights)

        # Construir resultado optimizado
        return self._build_optimized_result(
            shopping_list, item_candidates, best_solution, budget, weights
        )

    def _get_optimization_weights(self, optimize_for: str) -> Dict[str, float]:
        """Define pesos según objetivo de optimización"""
        weight_profiles = {
            "price": {
                "cost": 0.60,
                "sustainability": 0.15,
                "quality": 0.15,
                "preference": 0.10,
            },
            "sustainability": {
                "cost": 0.20,
                "sustainability": 0.50,
                "quality": 0.15,
                "preference": 0.15,
            },
            "health": {
                "cost": 0.20,
                "sustainability": 0.15,
                "quality": 0.50,
                "preference": 0.15,
            },
            "balanced": {
                "cost": 0.30,
                "sustainability": 0.30,
                "quality": 0.25,
                "preference": 0.15,
            },
        }
        return weight_profiles.get(optimize_for, weight_profiles["balanced"])

    def _find_candidate_products(
        self, item: ShoppingListItem, available_products: Dict[str, List[Product]]
    ) -> List[Product]:
        """Encuentra productos candidatos para un item de la lista"""
        candidates = []

        # Buscar en la categoría correspondiente
        category_products = available_products.get(item.category, [])

        for product in category_products:
            # Filtrar por precio máximo si está especificado
            if item.max_price and product.price > item.max_price:
                continue

            # Filtrar por preferencias (ej: organic, local)
            if item.preferences:
                if not self._matches_preferences(product, item.preferences):
                    continue

            candidates.append(product)

        # Ordenar por score de sostenibilidad inicial
        candidates.sort(
            key=lambda p: self.scorer.calculate_score(p).overall_score, reverse=True
        )

        return candidates[:20]  # Limitar a top 20 candidatos por item

    def _matches_preferences(self, product: Product, preferences: List[str]) -> bool:
        """Verifica si un producto cumple con las preferencias"""
        if not preferences:
            return True

        product_labels = [label.lower() for label in (product.labels or [])]

        # Al menos 50% de las preferencias deben cumplirse
        matches = sum(1 for pref in preferences if pref.lower() in product_labels)
        return matches >= len(preferences) * 0.5

    def _genetic_algorithm(
        self,
        item_candidates: List[Tuple[ShoppingListItem, List[Product]]],
        budget: float,
        weights: Dict[str, float],
    ) -> List[int]:
        """
        Algoritmo genético para optimización multi-objetivo

        Returns:
            Lista de índices de productos seleccionados (uno por item)
        """
        n_items = len(item_candidates)

        # Inicializar población
        population = self._initialize_population(n_items, item_candidates)

        # Evolucionar
        for generation in range(self.generations):
            # Evaluar fitness
            fitness_scores = [
                self._evaluate_fitness(individual, item_candidates, budget, weights)
                for individual in population
            ]

            # Selección (torneo)
            parents = self._tournament_selection(population, fitness_scores)

            # Crossover
            offspring = self._crossover(parents, n_items)

            # Mutación
            offspring = self._mutate(offspring, item_candidates)

            # Nueva generación (elitismo: mantener mejores)
            population = self._next_generation(population, offspring, fitness_scores)

        # Retornar mejor solución
        final_fitness = [
            self._evaluate_fitness(ind, item_candidates, budget, weights)
            for ind in population
        ]
        best_idx = max(range(len(final_fitness)), key=lambda i: final_fitness[i])
        return population[best_idx]

    def _initialize_population(
        self, n_items: int, item_candidates: List[Tuple[ShoppingListItem, List[Product]]]
    ) -> List[List[int]]:
        """Inicializa población con soluciones aleatorias válidas"""
        population = []
        for _ in range(self.population_size):
            individual = []
            for item, candidates in item_candidates:
                # Seleccionar producto aleatorio de candidatos
                if candidates:
                    individual.append(random.randint(0, len(candidates) - 1))
                else:
                    individual.append(0)
            population.append(individual)
        return population

    def _evaluate_fitness(
        self,
        individual: List[int],
        item_candidates: List[Tuple[ShoppingListItem, List[Product]]],
        budget: float,
        weights: Dict[str, float],
    ) -> float:
        """
        Evalúa la fitness de una solución considerando múltiples objetivos

        Fitness = w1*cost_score + w2*sustainability + w3*quality + w4*preference
        """
        total_cost = 0
        total_sustainability = 0
        total_quality = 0
        total_preference = 0
        count = 0

        for i, (item, candidates) in enumerate(item_candidates):
            if i >= len(individual) or not candidates:
                continue

            product_idx = individual[i]
            if product_idx >= len(candidates):
                continue

            product = candidates[product_idx]
            total_cost += product.price * item.quantity

            # Sustainability score
            sus_score = self.scorer.calculate_score(product)
            total_sustainability += sus_score.overall_score

            # Quality score (health + economic value)
            total_quality += (sus_score.health_score + sus_score.economic_score) / 2

            # Preference match score
            pref_score = self._calculate_preference_score(product, item.preferences)
            total_preference += pref_score

            count += 1

        if count == 0:
            return 0

        # Normalizar scores
        avg_sustainability = total_sustainability / count
        avg_quality = total_quality / count
        avg_preference = total_preference / count

        # Cost score (penalización si excede presupuesto)
        if budget < float('inf'):
            if total_cost <= budget:
                cost_score = 100 * (1 - total_cost / budget)  # Mejor si usa menos presupuesto
            else:
                # Penalización severa por exceder presupuesto
                excess_ratio = total_cost / budget - 1
                cost_score = -100 * excess_ratio
        else:
            # Sin restricción de presupuesto, preferir menor costo
            cost_score = 100 / (1 + total_cost / 10000)

        # Fitness ponderada
        fitness = (
            weights["cost"] * cost_score
            + weights["sustainability"] * avg_sustainability
            + weights["quality"] * avg_quality
            + weights["preference"] * avg_preference
        )

        return fitness

    def _calculate_preference_score(
        self, product: Product, preferences: Optional[List[str]]
    ) -> float:
        """Calcula qué tan bien un producto cumple las preferencias"""
        if not preferences:
            return 50.0  # Neutral

        product_labels = [label.lower() for label in (product.labels or [])]
        matches = sum(1 for pref in preferences if pref.lower() in product_labels)

        return (matches / len(preferences)) * 100

    def _tournament_selection(
        self, population: List[List[int]], fitness_scores: List[float], tournament_size: int = 3
    ) -> List[List[int]]:
        """Selección por torneo"""
        parents = []
        for _ in range(len(population)):
            # Seleccionar candidatos aleatorios
            tournament_indices = random.sample(range(len(population)), tournament_size)
            # Elegir el mejor
            winner_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
            parents.append(population[winner_idx].copy())
        return parents

    def _crossover(self, parents: List[List[int]], n_items: int) -> List[List[int]]:
        """Crossover de un punto"""
        offspring = []

        # Si solo hay 1 item, no hay crossover posible
        if n_items <= 1:
            return [p.copy() for p in parents]

        for i in range(0, len(parents) - 1, 2):
            parent1 = parents[i]
            parent2 = parents[i + 1]

            # Punto de crossover
            point = random.randint(1, n_items - 1)

            # Crear hijos
            child1 = parent1[:point] + parent2[point:]
            child2 = parent2[:point] + parent1[point:]

            offspring.extend([child1, child2])

        return offspring

    def _mutate(
        self, offspring: List[List[int]], item_candidates: List[Tuple[ShoppingListItem, List[Product]]]
    ) -> List[List[int]]:
        """Mutación: cambiar producto seleccionado aleatoriamente"""
        for individual in offspring:
            if random.random() < self.mutation_rate:
                # Mutar un gen aleatorio
                gene_idx = random.randint(0, len(individual) - 1)
                if gene_idx < len(item_candidates):
                    _, candidates = item_candidates[gene_idx]
                    if candidates:
                        individual[gene_idx] = random.randint(0, len(candidates) - 1)
        return offspring

    def _next_generation(
        self, population: List[List[int]], offspring: List[List[int]], fitness_scores: List[float]
    ) -> List[List[int]]:
        """Crear nueva generación con elitismo"""
        # Combinar población actual y offspring
        combined = population + offspring

        # Calcular fitness de offspring
        # (asumimos que fitness_scores es solo de population)
        # Por simplicidad, mantener top population_size

        # Ordenar por fitness y mantener los mejores
        sorted_indices = sorted(
            range(len(population)), key=lambda i: fitness_scores[i], reverse=True
        )

        # Mantener top 20% de élite
        elite_size = max(1, self.population_size // 5)
        new_population = [population[i] for i in sorted_indices[:elite_size]]

        # Completar con offspring
        new_population.extend(offspring[: self.population_size - elite_size])

        return new_population[: self.population_size]

    def _build_optimized_result(
        self,
        shopping_list: ShoppingList,
        item_candidates: List[Tuple[ShoppingListItem, List[Product]]],
        solution: List[int],
        budget: float,
        weights: Dict[str, float],
    ) -> OptimizedShoppingList:
        """Construye el resultado optimizado"""
        optimized_items = []
        total_cost = 0
        total_carbon = 0
        total_water = 0
        recyclable_count = 0
        items_substituted = 0

        sustainability_scores = []

        for i, (item, candidates) in enumerate(item_candidates):
            if i >= len(solution) or not candidates:
                continue

            product_idx = solution[i]
            if product_idx >= len(candidates):
                continue

            selected_product = candidates[product_idx]
            sus_score = self.scorer.calculate_score(selected_product)

            # Calcular alternativas (top 3 diferentes)
            alternatives = [c for j, c in enumerate(candidates[:5]) if j != product_idx]

            # Determinar si fue sustituido
            was_substituted = item.product_id and item.product_id != selected_product.id
            if was_substituted:
                items_substituted += 1

            # Razón de selección
            reason = self._generate_selection_reason(selected_product, sus_score, weights)

            # Calcular ahorros (comparado con el más caro de categoría)
            max_price = max(c.price for c in candidates) if candidates else selected_product.price
            savings = (max_price - selected_product.price) * item.quantity

            optimized_items.append(
                OptimizedProduct(
                    original_item=item,
                    selected_product=selected_product,
                    alternatives=alternatives[:3],
                    reason=reason,
                    savings=round(savings, 2),
                    sustainability_impact=self._get_impact_level(sus_score.environmental_score),
                )
            )

            # Acumular métricas
            total_cost += selected_product.price * item.quantity
            sustainability_scores.append(sus_score)

            if sus_score.carbon_footprint_kg:
                total_carbon += sus_score.carbon_footprint_kg * item.quantity
            if sus_score.water_usage_liters:
                total_water += sus_score.water_usage_liters * item.quantity
            if sus_score.packaging_recyclable:
                recyclable_count += 1

        # Calcular métricas agregadas
        if sustainability_scores:
            avg_scores = {
                "economic_score": sum(s.economic_score for s in sustainability_scores) / len(sustainability_scores),
                "environmental_score": sum(s.environmental_score for s in sustainability_scores) / len(sustainability_scores),
                "social_score": sum(s.social_score for s in sustainability_scores) / len(sustainability_scores),
                "health_score": sum(s.health_score for s in sustainability_scores) / len(sustainability_scores),
                "overall_score": sum(s.overall_score for s in sustainability_scores) / len(sustainability_scores),
            }
            overall_sustainability = SustainabilityScore(**avg_scores)
        else:
            overall_sustainability = SustainabilityScore(
                economic_score=0, environmental_score=0, social_score=0, health_score=0, overall_score=0
            )

        # Calcular ahorros totales
        estimated_savings = sum(item.savings for item in optimized_items)

        # Budget utilizado
        budget_used = (total_cost / budget * 100) if budget < float('inf') else 0

        # Tiendas recomendadas (agrupar por disponibilidad)
        store_counts = {}
        for opt_item in optimized_items:
            store = opt_item.selected_product.store or "Tienda General"
            store_counts[store] = store_counts.get(store, 0) + 1

        recommended_stores = sorted(store_counts.keys(), key=lambda s: store_counts[s], reverse=True)

        return OptimizedShoppingList(
            original_list=shopping_list,
            optimized_items=optimized_items,
            total_cost=round(total_cost, 2),
            estimated_savings=round(estimated_savings, 2),
            budget_used_percentage=round(budget_used, 2),
            overall_sustainability=overall_sustainability,
            total_carbon_footprint=round(total_carbon, 2),
            total_water_usage=round(total_water, 2),
            recyclable_percentage=round(
                (recyclable_count / len(optimized_items) * 100) if optimized_items else 0, 2
            ),
            optimization_algorithm="Multi-Objective Genetic Algorithm",
            constraints_met=total_cost <= budget if budget < float('inf') else True,
            items_substituted=items_substituted,
            optimization_score=round(overall_sustainability.overall_score, 2),
            recommended_stores=recommended_stores[:3],
            estimated_shopping_time=len(recommended_stores) * 15 + len(optimized_items) * 2,
        )

    def _generate_selection_reason(
        self, product: Product, sus_score: SustainabilityScore, weights: Dict[str, float]
    ) -> str:
        """Genera una razón clara de por qué se seleccionó este producto"""
        reasons = []

        if sus_score.overall_score >= 80:
            reasons.append("Excelente balance sostenibilidad-precio")
        elif sus_score.overall_score >= 60:
            reasons.append("Buena opción balanceada")

        if sus_score.environmental_score >= 75:
            reasons.append("bajo impacto ambiental")
        if sus_score.health_score >= 75:
            reasons.append("alta calidad nutricional")
        if sus_score.economic_score >= 75:
            reasons.append("excelente precio")

        if not reasons:
            reasons.append("Mejor opción disponible")

        return ", ".join(reasons).capitalize()

    def _get_impact_level(self, score: float) -> str:
        """Convierte score a nivel de impacto"""
        if score >= 75:
            return "low"
        elif score >= 50:
            return "medium"
        else:
            return "high"

    def _create_empty_result(self, shopping_list: ShoppingList) -> OptimizedShoppingList:
        """Crea resultado vacío cuando no hay productos disponibles"""
        return OptimizedShoppingList(
            original_list=shopping_list,
            optimized_items=[],
            total_cost=0,
            estimated_savings=0,
            budget_used_percentage=0,
            overall_sustainability=SustainabilityScore(
                economic_score=0,
                environmental_score=0,
                social_score=0,
                health_score=0,
                overall_score=0,
            ),
            optimization_algorithm="Multi-Objective Genetic Algorithm",
            constraints_met=True,
            optimization_score=0,
        )
