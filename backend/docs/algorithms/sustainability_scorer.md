# Sustainability Scorer

## Descripción

El `SustainabilityScorer` calcula puntuaciones de sostenibilidad para productos basándose en múltiples dimensiones: económica, ambiental, social y de salud.

## Modelo de Puntuación

### Dimensiones (0-100 cada una)

```
┌─────────────────────────────────────────┐
│         SUSTAINABILITY SCORE            │
├──────────┬──────────┬─────────┬─────────┤
│ Economic │ Environ. │ Social  │ Health  │
│   25%    │   30%    │   20%   │   25%   │
└──────────┴──────────┴─────────┴─────────┘
```

### Fórmula General

```python
overall_score = (
    0.25 * economic_score +
    0.30 * environmental_score +
    0.20 * social_score +
    0.25 * health_score
)
```

## Cálculo por Dimensión

### Economic Score (25%)

Evalúa el valor económico del producto:

```python
def calculate_economic_score(product):
    score = 50  # Base

    # Precio competitivo (comparado con promedio de categoría)
    if product.price < category_average:
        score += 20

    # Descuentos activos
    if product.discount > 0:
        score += min(product.discount * 2, 20)

    # Relación cantidad/precio
    if product.unit_price < threshold:
        score += 10

    return min(score, 100)
```

### Environmental Score (30%)

Evalúa impacto ambiental:

```python
def calculate_environmental_score(product):
    score = 50  # Base

    # Huella de carbono baja
    if product.carbon_footprint < 1.0:
        score += 15
    elif product.carbon_footprint < 2.0:
        score += 10

    # Producto local (menos transporte)
    if product.local_product:
        score += 15

    # Packaging reciclable
    if product.packaging_recyclable:
        score += 10

    # Certificación orgánica
    if 'organic' in product.labels:
        score += 10

    return min(score, 100)
```

### Social Score (20%)

Evalúa impacto social:

```python
def calculate_social_score(product):
    score = 50  # Base

    # Comercio justo
    if product.fair_trade:
        score += 20

    # Productor local/pequeño
    if product.local_product:
        score += 15

    # Certificaciones sociales
    if product.social_certifications:
        score += 15

    return min(score, 100)
```

### Health Score (25%)

Evalúa valor nutricional:

```python
def calculate_health_score(product):
    score = 50  # Base

    # NutriScore (A=20, B=15, C=10, D=5, E=0)
    nutri_bonus = {'A': 20, 'B': 15, 'C': 10, 'D': 5, 'E': 0}
    score += nutri_bonus.get(product.nutri_score, 0)

    # Orgánico
    if 'organic' in product.labels:
        score += 10

    # Sin aditivos artificiales
    if product.no_additives:
        score += 10

    # Alto en fibra/proteína
    if product.high_fiber or product.high_protein:
        score += 10

    return min(score, 100)
```

## Ejemplos de Puntuación

### Producto Alta Sostenibilidad

**Leche Orgánica Local**
```
Economic:      65  (precio mayor pero buena calidad)
Environmental: 90  (orgánico + local + reciclable)
Social:        85  (comercio justo + productor local)
Health:        80  (NutriScore A + orgánico)
─────────────────
Overall:       80.5
```

### Producto Baja Sostenibilidad

**Refresco Industrial**
```
Economic:      70  (precio bajo)
Environmental: 35  (alto carbono + plástico)
Social:        45  (producción masiva)
Health:        25  (NutriScore E + azúcar)
─────────────────
Overall:       43.0
```

## Configuración de Pesos

Los pesos pueden ajustarse según el contexto:

```python
# Para mercado eco-consciente
WEIGHTS = {
    'economic': 0.15,
    'environmental': 0.40,
    'social': 0.25,
    'health': 0.20
}

# Para mercado price-sensitive
WEIGHTS = {
    'economic': 0.40,
    'environmental': 0.20,
    'social': 0.15,
    'health': 0.25
}
```

## Uso en el Optimizador

```python
scorer = SustainabilityScorer()

# En selección de productos
if optimize_for == "sustainability":
    best = max(candidates,
               key=lambda p: scorer.calculate_score(p).overall_score)

# En cálculo de métricas finales
for product in selected_products:
    score = scorer.calculate_score(product)
    total_sustainability += score.overall_score
```

## Limitaciones Conocidas

1. **Datos incompletos**: No todos los productos tienen todas las métricas
2. **Ponderación fija**: Los pesos no se adaptan al usuario
3. **Sin contexto temporal**: No considera estacionalidad
4. **Simplificación**: El impacto real es más complejo que un número

## Extensiones Propuestas

1. **Pesos personalizables** por usuario
2. **Machine learning** para ajustar pesos según feedback
3. **Datos en tiempo real** de huella de carbono
4. **Comparación con alternativas** de la misma categoría
