"""
Servicio de gestión de productos
Maneja la lógica de negocio de productos, análisis y búsqueda
"""

import json
from typing import List, Optional, Dict
from pathlib import Path
from ..models.product import Product, ProductAnalysis
from ..algorithms import SustainabilityScorer, IntelligentSubstitutionEngine


class ProductService:
    """Servicio para gestión de productos"""

    def __init__(self, dataset_path: str = "data/products_dataset.json"):
        self.dataset_path = dataset_path
        self.products: List[Product] = []
        self.scorer = SustainabilityScorer()
        self.substitution_engine = IntelligentSubstitutionEngine(self.scorer)
        self._load_products()

    def _load_products(self):
        """Carga productos desde el dataset JSON"""
        try:
            # Intentar desde la raíz del proyecto
            path = Path(self.dataset_path)
            if not path.exists():
                # Intentar desde backend/
                path = Path(__file__).parent.parent.parent.parent / self.dataset_path

            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.products = [Product(**p) for p in data.get("products", [])]
                print(f"✓ Loaded {len(self.products)} products from dataset")
            else:
                print(f"⚠ Dataset not found at {path}, using empty product list")
        except Exception as e:
            print(f"Error loading products: {e}")
            self.products = []

    def get_all_products(self) -> List[Product]:
        """Obtiene todos los productos"""
        return self.products

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Busca un producto por ID"""
        for product in self.products:
            if product.id == product_id:
                return product
        return None

    def get_product_by_barcode(self, barcode: str) -> Optional[Product]:
        """Busca un producto por código de barras"""
        for product in self.products:
            if product.barcode == barcode:
                return product
        return None

    def search_products(
        self,
        query: str = "",
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        labels: Optional[List[str]] = None,
        store: Optional[str] = None,
    ) -> List[Product]:
        """
        Busca productos con filtros múltiples

        Args:
            query: Texto a buscar en nombre/descripción
            category: Filtrar por categoría
            min_price: Precio mínimo
            max_price: Precio máximo
            labels: Labels requeridas (organic, local, etc.)
            store: Tienda específica

        Returns:
            Lista de productos que coinciden
        """
        results = self.products.copy()

        # Filtro por query
        if query:
            query_lower = query.lower()
            results = [
                p
                for p in results
                if query_lower in p.name.lower()
                or (p.description and query_lower in p.description.lower())
                or (p.brand and query_lower in p.brand.lower())
            ]

        # Filtro por categoría
        if category:
            results = [p for p in results if p.category.lower() == category.lower()]

        # Filtro por precio
        if min_price is not None:
            results = [p for p in results if p.price >= min_price]
        if max_price is not None:
            results = [p for p in results if p.price <= max_price]

        # Filtro por labels
        if labels:
            results = [
                p
                for p in results
                if p.labels and any(label.lower() in [l.lower() for l in p.labels] for label in labels)
            ]

        # Filtro por tienda
        if store:
            results = [p for p in results if p.store and store.lower() in p.store.lower()]

        return results

    def get_products_by_category(self, category: str) -> List[Product]:
        """Obtiene todos los productos de una categoría"""
        return [p for p in self.products if p.category.lower() == category.lower()]

    def get_categories(self) -> List[str]:
        """Obtiene lista de todas las categorías disponibles"""
        categories = set(p.category for p in self.products)
        return sorted(list(categories))

    def analyze_product(self, product_id: str) -> Optional[ProductAnalysis]:
        """
        Analiza un producto completo con sostenibilidad y alternativas

        Returns:
            ProductAnalysis completo o None si no existe
        """
        product = self.get_product_by_id(product_id)
        if not product:
            return None

        # Calcular sustainability score
        sustainability = self.scorer.calculate_score(product)

        # Encontrar alternativas de la misma categoría
        category_products = self.get_products_by_category(product.category)
        alternatives = [p for p in category_products if p.id != product.id][:5]

        # Calcular potencial de ahorro (vs más caro de categoría)
        if category_products:
            max_price = max(p.price for p in category_products)
            savings_potential = max_price - product.price
        else:
            savings_potential = 0

        # Determinar impacto ambiental
        env_score = sustainability.environmental_score
        if env_score >= 75:
            env_impact = "low"
        elif env_score >= 50:
            env_impact = "medium"
        else:
            env_impact = "high"

        # Generar recomendación
        if sustainability.overall_score >= 80:
            recommendation = "Excelente elección! Este producto tiene un balance óptimo de precio, sostenibilidad y salud."
        elif sustainability.overall_score >= 60:
            recommendation = "Buena opción, aunque hay alternativas con mejor sostenibilidad disponibles."
        else:
            recommendation = "Considera las alternativas sugeridas para un mejor impacto ambiental y de salud."

        # Health rating
        health_score = sustainability.health_score
        if health_score >= 80:
            health_rating = "excellent"
        elif health_score >= 60:
            health_rating = "good"
        elif health_score >= 40:
            health_rating = "average"
        else:
            health_rating = "poor"

        return ProductAnalysis(
            product=product,
            sustainability=sustainability,
            alternatives=alternatives,
            savings_potential=round(savings_potential, 2),
            environmental_impact=env_impact,
            recommendation=recommendation,
            health_rating=health_rating,
        )

    def compare_products(self, product_ids: List[str]) -> Dict:
        """Compara múltiples productos"""
        products = [self.get_product_by_id(pid) for pid in product_ids]
        products = [p for p in products if p is not None]

        if len(products) < 2:
            return {"error": "Need at least 2 products to compare"}

        # Analizar cada producto
        analyses = [self.analyze_product(p.id) for p in products]

        # Encontrar mejor en cada dimensión
        best_price = min(products, key=lambda p: p.price)

        scored_products = [(p, self.scorer.calculate_score(p)) for p in products]
        best_sustainability = max(scored_products, key=lambda x: x[1].overall_score)[0]
        best_health = max(scored_products, key=lambda x: x[1].health_score)[0]

        return {
            "products": [a.dict() for a in analyses if a],
            "best_price": {"id": best_price.id, "name": best_price.name, "price": best_price.price},
            "best_sustainability": {
                "id": best_sustainability.id,
                "name": best_sustainability.name,
            },
            "best_health": {
                "id": best_health.id,
                "name": best_health.name,
            },
        }

    def get_product_catalog(self) -> Dict[str, List[Product]]:
        """
        Retorna catálogo organizado por categorías

        Returns:
            Dict de category -> lista de productos
        """
        catalog = {}
        for product in self.products:
            if product.category not in catalog:
                catalog[product.category] = []
            catalog[product.category].append(product)
        return catalog

    def get_recommendations_for_product(
        self, product_id: str, focus: str = "balanced", max_results: int = 5
    ) -> List:
        """Obtiene recomendaciones de sustitución para un producto"""
        product = self.get_product_by_id(product_id)
        if not product:
            return []

        # Obtener productos de la misma categoría
        category_products = self.get_products_by_category(product.category)

        # Usar motor de sustitución
        suggestions = self.substitution_engine.find_substitutions(
            product, category_products, focus=focus, max_suggestions=max_results
        )

        return [s.dict() for s in suggestions]
