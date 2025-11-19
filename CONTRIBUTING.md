# Guía de Contribución

## Bienvenido

Gracias por tu interés en contribuir a LiquiVerde. Esta guía te ayudará a configurar tu entorno y seguir las mejores prácticas del proyecto.

## Configuración del Entorno

### Requisitos Previos

- Python 3.11+
- Node.js 18+
- Docker y Docker Compose
- Git

### Setup Inicial

```bash
# Clonar repositorio
git clone <repo-url>
cd liquiverde

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Levantar servicios
docker compose up -d
```

## Estilo de Código

### Python (Backend)

**Formatter**: Black
```bash
# Formatear código
black app/ tests/

# Verificar sin cambiar
black --check app/ tests/
```

**Linter**: Ruff
```bash
ruff check app/ tests/
```

**Type Hints**: Obligatorios en funciones públicas
```python
# Correcto
def optimize(self, shopping_list: ShoppingList, catalog: Dict[str, List[Product]]) -> OptimizedShoppingList:
    pass

# Incorrecto
def optimize(self, shopping_list, catalog):
    pass
```

**Docstrings**: Google style
```python
def calculate_score(self, product: Product) -> SustainabilityScore:
    """
    Calcula el score de sostenibilidad de un producto.

    Args:
        product: Producto a evaluar

    Returns:
        SustainabilityScore con las puntuaciones por dimensión
    """
```

### JavaScript/React (Frontend)

**Formatter**: Prettier
```bash
npm run format
```

**Linter**: ESLint
```bash
npm run lint
```

**Componentes**: Functional con hooks
```jsx
// Correcto
export default function ProductCard({ product, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);
  // ...
}

// Evitar: Class components
```

## Proceso de Git

### Branches

```
main          # Producción estable
├── develop   # Integración de features
├── feature/* # Nuevas funcionalidades
├── fix/*     # Corrección de bugs
└── docs/*    # Documentación
```

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]

[footer opcional]
```

**Tipos permitidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato (no afecta lógica)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```bash
feat(optimizer): add budget upgrade phase
fix(api): handle empty product catalog
docs(readme): update installation instructions
test(scorer): add edge case tests for organic products
```

### Pull Requests

1. **Crear branch desde `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Desarrollar y commitear**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push y crear PR**
   ```bash
   git push -u origin feature/my-feature
   # Crear PR en GitHub apuntando a develop
   ```

4. **Template de PR**
   ```markdown
   ## Summary
   - Descripción breve de los cambios

   ## Changes
   - Lista de cambios específicos

   ## Test Plan
   - [ ] Tests unitarios pasan
   - [ ] Tests de integración pasan
   - [ ] Probado manualmente en local

   ## Screenshots (si aplica)
   ```

5. **Review y merge**
   - Mínimo 1 approval requerido
   - CI debe pasar (tests, lint)
   - Squash merge preferido

## Testing

### Backend

```bash
cd backend

# Correr todos los tests
pytest

# Con coverage
pytest --cov=app --cov-report=html

# Test específico
pytest tests/test_knapsack_optimizer.py -v

# Solo tests que matchean pattern
pytest -k "test_budget"
```

**Estructura de tests:**
```python
# tests/test_knapsack_optimizer.py

import pytest
from app.algorithms import MultiObjectiveKnapsackOptimizer

class TestKnapsackOptimizer:
    @pytest.fixture
    def optimizer(self):
        return MultiObjectiveKnapsackOptimizer()

    def test_optimize_with_sufficient_budget(self, optimizer, sample_products):
        """Debe seleccionar todos los items cuando hay presupuesto."""
        result = optimizer.optimize(shopping_list, products)
        assert len(result.optimized_items) == len(shopping_list.items)

    def test_optimize_excludes_low_priority_items(self, optimizer):
        """Debe excluir items de baja prioridad si no caben."""
        # ...
```

### Frontend

```bash
cd frontend

# Correr tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Estructura de tests:**
```jsx
// src/components/__tests__/ProductSearch.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import ProductSearch from '../ProductSearch';

describe('ProductSearch', () => {
  it('should display search results', async () => {
    render(<ProductSearch />);

    fireEvent.change(screen.getByPlaceholderText('Buscar...'), {
      target: { value: 'leche' }
    });

    expect(await screen.findByText('Leche Entera')).toBeInTheDocument();
  });
});
```

### Coverage Mínimo

- Backend: 80%
- Frontend: 70%
- Nuevos features: 90%

## Añadir Nuevos Features

### 1. Nuevo Algoritmo

```python
# backend/app/algorithms/my_algorithm.py

class MyAlgorithm:
    """
    Descripción del algoritmo y su propósito.
    """

    def __init__(self, dependency: SomeDependency):
        self.dependency = dependency

    def process(self, input_data: InputModel) -> OutputModel:
        """
        Procesa los datos de entrada.

        Args:
            input_data: Datos a procesar

        Returns:
            Resultado procesado
        """
        pass
```

Agregar en `__init__.py`:
```python
from .my_algorithm import MyAlgorithm
```

### 2. Nuevo Endpoint

```python
# backend/app/routes/my_route.py

from fastapi import APIRouter, HTTPException
from ..models.my_model import MyRequest, MyResponse
from ..services.my_service import MyService

router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])
service = MyService()

@router.post("/action")
async def my_action(request: MyRequest) -> MyResponse:
    """
    Descripción del endpoint.

    Body ejemplo:
    ```json
    {"field": "value"}
    ```
    """
    try:
        result = service.do_action(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

Registrar en `main.py`:
```python
from .routes import my_route
app.include_router(my_route.router)
```

### 3. Nuevo Componente React

```jsx
// frontend/src/components/MyComponent.jsx

import { useState, useEffect } from 'react';
import { myAPI } from '../services/api';

export default function MyComponent({ prop1, onAction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await myAPI.getData();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="my-component">
      {/* Contenido */}
    </div>
  );
}
```

## Documentación

### Código

- Docstrings en todas las funciones públicas
- Comentarios para lógica compleja
- Type hints completos

### Algorithms

Si agregas un nuevo algoritmo, crear documentación en:
```
backend/docs/algorithms/my_algorithm.md
```

Incluir:
- Descripción del problema que resuelve
- Pseudocódigo o diagrama de flujo
- Complejidad computacional
- Ejemplos de uso
- Parámetros de configuración

### API

Los endpoints se documentan automáticamente con Swagger. Agregar:
- Descripción en el docstring
- Ejemplos de request/response
- Códigos de error posibles

## Reporting Issues

### Bug Report

```markdown
**Descripción**
Descripción clara del bug

**Pasos para reproducir**
1. Ir a '...'
2. Click en '...'
3. Ver error

**Comportamiento esperado**
Qué debería pasar

**Comportamiento actual**
Qué pasa actualmente

**Screenshots**
Si aplica

**Entorno**
- OS: [e.g. Ubuntu 22.04]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

### Feature Request

```markdown
**Problema**
Descripción del problema que resuelve

**Solución propuesta**
Cómo debería funcionar

**Alternativas consideradas**
Otras opciones evaluadas

**Contexto adicional**
Mockups, referencias, etc.
```

## Contacto

- Issues: GitHub Issues
- Discusiones: GitHub Discussions
- Email: dev@liquiverde.cl

## Código de Conducta

- Ser respetuoso y constructivo
- Aceptar feedback de buena fe
- Enfocarse en lo mejor para el proyecto
- Mostrar empatía hacia otros contribuidores
