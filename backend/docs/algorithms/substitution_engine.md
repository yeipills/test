# Substitution Engine

## Descripción

El `SubstitutionEngine` sugiere productos alternativos cuando un producto no está disponible o el usuario busca opciones similares con diferentes características.

## Tipos de Sustitución

### 1. Sustitución por Disponibilidad
Cuando un producto está agotado, encontrar el más similar disponible.

### 2. Sustitución por Precio
Encontrar alternativas más económicas manteniendo calidad.

### 3. Sustitución por Sostenibilidad
Encontrar alternativas más sostenibles/saludables.

### 4. Sustitución por Preferencias
Respetar restricciones dietéticas (sin gluten, vegano, etc.).

## Algoritmo de Similitud

### Cálculo de Score de Similitud

```python
def calculate_similarity(product_a, product_b):
    score = 0.0

    # Misma categoría (peso alto)
    if product_a.category == product_b.category:
        score += 40

    # Similitud de nombre (fuzzy matching)
    name_similarity = fuzzy_ratio(product_a.name, product_b.name)
    score += name_similarity * 0.2  # max 20 puntos

    # Rango de precio similar (±30%)
    price_ratio = min(product_a.price, product_b.price) / max(product_a.price, product_b.price)
    if price_ratio > 0.7:
        score += 20
    elif price_ratio > 0.5:
        score += 10

    # Misma marca
    if product_a.brand == product_b.brand:
        score += 10

    # Labels compartidos
    shared_labels = set(product_a.labels) & set(product_b.labels)
    score += len(shared_labels) * 5  # max ~10 puntos

    return min(score, 100)
```

### Matriz de Sustitución por Categoría

```python
SUBSTITUTION_MATRIX = {
    'dairy': {
        'alternatives': ['plant_milk', 'yogurt'],
        'similarity_boost': 0.8
    },
    'meat': {
        'alternatives': ['legumes', 'tofu'],
        'similarity_boost': 0.6
    },
    'bread': {
        'alternatives': ['cereals', 'crackers'],
        'similarity_boost': 0.7
    }
}
```

## Proceso de Sustitución

```
┌─────────────────┐
│ Producto No     │
│ Disponible      │
└────────┬────────┘
         │
┌────────▼────────┐
│ Buscar en misma │
│ categoría       │
└────────┬────────┘
         │
    ¿Encontrado?
    ╱          ╲
   Sí          No
   │            │
   │    ┌───────▼───────┐
   │    │ Buscar en     │
   │    │ categorías    │
   │    │ alternativas  │
   │    └───────┬───────┘
   │            │
┌──▼────────────▼──┐
│ Ordenar por      │
│ similitud        │
└────────┬─────────┘
         │
┌────────▼────────┐
│ Retornar top N  │
│ sustitutos      │
└─────────────────┘
```

## Filtros de Sustitución

### Filtros Obligatorios

```python
def apply_mandatory_filters(candidates, preferences):
    filtered = candidates

    # Restricciones dietéticas (nunca violar)
    if 'gluten_free' in preferences:
        filtered = [p for p in filtered if 'gluten_free' in p.labels]

    if 'vegan' in preferences:
        filtered = [p for p in filtered if 'vegan' in p.labels]

    if 'lactose_free' in preferences:
        filtered = [p for p in filtered if 'lactose_free' in p.labels]

    return filtered
```

### Filtros Opcionales (Soft Preferences)

```python
def apply_soft_preferences(candidates, preferences):
    # Ordenar favoreciendo preferencias, pero no excluir

    def preference_score(product):
        score = 0
        if 'organic' in preferences and 'organic' in product.labels:
            score += 10
        if 'local' in preferences and product.local_product:
            score += 10
        return score

    return sorted(candidates, key=preference_score, reverse=True)
```

## Ejemplos de Uso

### Ejemplo 1: Sustitución Simple

```python
# Usuario busca "Leche Colun" pero está agotada
original = Product(name="Leche Colun", category="dairy", price=1490)

sustitutos = engine.find_substitutes(original)
# Returns:
# 1. Leche Soprole (similitud: 85) - misma categoría, precio similar
# 2. Leche Orgánica (similitud: 70) - misma categoría, precio mayor
# 3. Leche de Almendras (similitud: 55) - categoría alternativa
```

### Ejemplo 2: Con Restricciones

```python
# Usuario vegano busca sustituto para queso
original = Product(name="Queso Gouda", category="dairy")
preferences = ['vegan']

sustitutos = engine.find_substitutes(original, preferences)
# Returns:
# 1. Queso Vegano NotCo (similitud: 75)
# 2. Tofu Firme (similitud: 50)
# Excluye: quesos lácteos
```

### Ejemplo 3: Optimización por Precio

```python
# Encontrar alternativa más barata
original = Product(name="Aceite Oliva Premium", price=8990)

sustitutos = engine.find_cheaper_alternatives(original)
# Returns:
# 1. Aceite Oliva Standard ($5990) - ahorro $3000
# 2. Aceite Vegetal ($2490) - ahorro $6500, menor calidad
```

## Configuración

### Parámetros Ajustables

```python
class SubstitutionEngine:
    # Número máximo de sustitutos a retornar
    MAX_SUBSTITUTES = 5

    # Similitud mínima para considerar como sustituto
    MIN_SIMILARITY_THRESHOLD = 40

    # Rango de precio aceptable (±%)
    PRICE_TOLERANCE = 0.3

    # Penalización por cambio de categoría
    CATEGORY_CHANGE_PENALTY = 20
```

## Integración con Optimizador

```python
# En el optimizador, cuando no encuentra producto exacto
candidates = self._find_candidate_products(item, available_products)

if not candidates:
    # Usar substitution engine como fallback
    similar = engine.find_substitutes_by_name(item.product_name)
    if similar:
        candidates = similar
        warnings.append(f"'{item.product_name}' sustituido por alternativas similares")
```

## Métricas de Calidad

Para evaluar la calidad de las sustituciones:

```python
def evaluate_substitution_quality(original, substitute):
    return {
        'similarity_score': calculate_similarity(original, substitute),
        'price_difference': substitute.price - original.price,
        'sustainability_difference': (
            scorer.calculate_score(substitute).overall_score -
            scorer.calculate_score(original).overall_score
        ),
        'user_preference_match': calculate_preference_match(substitute, preferences)
    }
```

## Limitaciones

1. **Similitud subjetiva**: Lo que es "similar" varía por usuario
2. **Datos de atributos**: Depende de tener labels completos
3. **Sin historial**: No aprende de aceptaciones/rechazos previos
4. **Contexto limitado**: No considera recetas o combinaciones

## Mejoras Futuras

1. **Embeddings de productos** para similitud semántica
2. **Collaborative filtering** basado en otros usuarios
3. **Feedback loop** para mejorar sugerencias
4. **Sustitución contextual** (ej: para receta específica)
