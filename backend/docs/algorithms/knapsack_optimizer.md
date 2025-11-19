# Multi-Objective Knapsack Optimizer

## Descripción General

El `MultiObjectiveKnapsackOptimizer` es el algoritmo central de LiquiVerde. Optimiza listas de compras maximizando valor (según objetivo seleccionado) mientras respeta restricciones de presupuesto.

## Problema que Resuelve

**Problema de la Mochila Multi-Objetivo:**
- Dado un presupuesto limitado (capacidad de la mochila)
- Y una lista de productos deseados (items)
- Seleccionar las mejores variantes de cada producto
- Maximizando: precio, sostenibilidad, salud o balance

## Algoritmo

### Fases de Ejecución

```
┌─────────────────┐
│  Fase 1: Match  │  Encontrar candidatos para cada item
└────────┬────────┘
         │
┌────────▼────────┐
│ Fase 2: Select  │  Elegir mejor variante según objetivo
└────────┬────────┘
         │
┌────────▼────────┐
│  Fase 3: Fit    │  Ajustar al presupuesto (greedy)
└────────┬────────┘
         │
┌────────▼────────┐
│ Fase 4: Build   │  Construir resultado con métricas
└─────────────────┘
```

### Fase 1: Búsqueda de Candidatos

```python
def _find_candidate_products(item, available_products):
    # Prioridad de matching:
    # 1. Match exacto: "leche" en "Leche Entera"
    # 2. Match parcial: primera palabra coincide
    # 3. Fallback: todos los productos de la categoría
```

**Ejemplo:**
- Input: `product_name="arroz"`
- Candidatos encontrados:
  - Arroz Integral Tucapel 1kg ($2290)
  - Arroz Blanco Miraflores 1kg ($1790)

### Fase 2: Selección Óptima

```python
def _select_best_product(item, candidates, optimize_for):
    if optimize_for == "price":
        return min(candidates, key=lambda p: p.price)

    elif optimize_for == "sustainability":
        return max(candidates, key=lambda p: scorer.calculate_score(p).overall_score)

    elif optimize_for == "health":
        return max(candidates, key=lambda p: scorer.calculate_score(p).health_score)

    else:  # balanced
        return max(candidates, key=lambda p: balanced_score(p))
```

**Score Balanceado:**
```python
balanced_score = (
    0.3 * price_score +      # Normalizado 0-100
    0.3 * sustainability +   # Score 0-100
    0.2 * health_score +     # Score 0-100
    0.2 * preference_match   # Bonus por preferencias
)
```

### Fase 3: Ajuste al Presupuesto (Greedy Knapsack)

Cuando el costo total excede el presupuesto:

```python
def _fit_to_budget(selections, budget):
    # Paso 1: ¿Cabe todo con selección original?
    if original_cost <= budget:
        return selections

    # Paso 2: Cambiar a variantes más baratas
    cheap_selections = [select_cheapest(s) for s in selections]
    if cheap_cost <= budget:
        return upgrade_if_possible(cheap_selections)

    # Paso 3: Knapsack greedy - excluir items por eficiencia
    efficiency = (6 - priority) / cost  # Mayor prioridad = mayor valor
    sorted_items = sort_by_efficiency(cheap_selections)

    included = []
    for item in sorted_items:
        if current_cost + item.cost <= budget:
            included.append(item)
            current_cost += item.cost

    return upgrade_if_possible(included)
```

**Función de Eficiencia:**
```
eficiencia = valor / costo

donde:
  valor = 6 - prioridad  (prioridad 1 → valor 5, prioridad 5 → valor 1)
  costo = precio × cantidad
```

### Fase 4: Construcción del Resultado

Calcula métricas finales:
- Costo total y ahorro estimado
- Score de sostenibilidad promedio
- Huella de carbono y uso de agua
- Tiendas recomendadas

## Complejidad Computacional

| Operación | Complejidad | Notas |
|-----------|-------------|-------|
| Búsqueda de candidatos | O(n × m) | n=items, m=productos por categoría |
| Selección óptima | O(n × m) | Evalúa todos los candidatos |
| Ajuste a presupuesto | O(n log n) | Ordenamiento por eficiencia |
| **Total** | **O(n × m)** | Lineal en tamaño del catálogo |

## Parámetros de Tuning

### Pesos del Score Balanceado

En `_select_best_product`:
```python
PRICE_WEIGHT = 0.3         # Importancia del precio
SUSTAINABILITY_WEIGHT = 0.3 # Importancia ambiental
HEALTH_WEIGHT = 0.2        # Importancia nutricional
PREFERENCE_WEIGHT = 0.2    # Bonus por preferencias del usuario
```

### Umbral de Nombre Específico

```python
if len(search_name) > 15:  # Nombres largos = producto específico
    # Priorizar match exacto sobre optimización
```

Ajustar este valor afecta cuándo el usuario "fuerza" un producto específico.

## Casos de Uso

### Caso 1: Presupuesto Suficiente
```
Input:  [Leche, Pan, Arroz], budget=20000, optimize_for=price
Output: Variantes más baratas de cada producto
```

### Caso 2: Presupuesto Ajustado
```
Input:  [Leche, Pan, Arroz, Aceite], budget=5000, optimize_for=balanced
Output: Excluye aceite (menor prioridad), elige variantes baratas del resto
```

### Caso 3: Priorizar Sostenibilidad
```
Input:  [Leche], budget=5000, optimize_for=sustainability
Output: Leche Orgánica ($2990) en lugar de Leche Entera ($1490)
```

## Extensiones Futuras

1. **Algoritmo genético** para optimización multi-objetivo más precisa
2. **Programación dinámica** para knapsack exacto (no greedy)
3. **Restricciones adicionales**: alérgenos, dietas, marcas preferidas
4. **Aprendizaje de preferencias** basado en historial del usuario
