"""
Servicio de gestión de productos
Maneja la lógica de negocio de productos, análisis y búsqueda
Con soporte para PostgreSQL y Redis cache
"""

import json
import hashlib
from typing import List, Optional, Dict
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..models.product import Product, ProductAnalysis
from ..algorithms import SustainabilityScorer, IntelligentSubstitutionEngine
from ..cache import cache_service
from ..database import SessionLocal
from ..db_models import ProductDB


class ProductService:
    """Servicio para gestión de productos con soporte de DB y cache"""

    def __init__(self, dataset_path: str = "data/products_dataset.json", use_db: bool = True):
        self.dataset_path = dataset_path
        self.products: List[Product] = []
        self.scorer = SustainabilityScorer()
        self.substitution_engine = IntelligentSubstitutionEngine(self.scorer)
        self.use_db = use_db
        self._db_available = False

        # Try to use database, fallback to JSON
        if use_db:
            self._db_available = self._check_db_connection()

        if not self._db_available:
            self._load_products_from_json()

    def _check_db_connection(self) -> bool:
        """Check if database is available"""
        try:
            db = SessionLocal()
            db.execute("SELECT 1")
            count = db.query(ProductDB).count()
            db.close()
            if count > 0:
                print(f"Using database with {count} products")
                return True
            print("Database empty, loading from JSON")
            return False
        except Exception as e:
            print(f"Database not available: {e}")
            return False

    def _load_products_from_json(self):
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
                print(f"Loaded {len(self.products)} products from JSON")
            else:
                print(f"Dataset not found at {path}, using empty product list")
        except Exception as e:
            print(f"Error loading products: {e}")
            self.products = []

    def _get_db(self):
        """Get database session"""
        return SessionLocal()

    def _product_db_to_model(self, product_db: ProductDB) -> Product:
        """Convert database model to Pydantic model"""
        return Product(**product_db.to_dict())

    def get_all_products(self) -> List[Product]:
        """Obtiene todos los productos"""
        # Try cache first
        cached = cache_service.get_cached_category("all")
        if cached:
            return [Product(**p) for p in cached]

        if self._db_available:
            db = self._get_db()
            try:
                products_db = db.query(ProductDB).all()
                products = [self._product_db_to_model(p) for p in products_db]
                # Cache results
                cache_service.cache_category_products("all", [p.dict() for p in products])
                return products
            finally:
                db.close()

        return self.products

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Busca un producto por ID"""
        # Try cache first
        cached = cache_service.get_cached_product(product_id)
        if cached:
            return Product(**cached)

        if self._db_available:
            db = self._get_db()
            try:
                product_db = db.query(ProductDB).filter(ProductDB.id == product_id).first()
                if product_db:
                    product = self._product_db_to_model(product_db)
                    # Cache result
                    cache_service.cache_product(product_id, product.dict())
                    return product
                return None
            finally:
                db.close()

        for product in self.products:
            if product.id == product_id:
                return product
        return None

    def get_product_by_barcode(self, barcode: str) -> Optional[Product]:
        """Busca un producto por código de barras"""
        if self._db_available:
            db = self._get_db()
            try:
                product_db = db.query(ProductDB).filter(ProductDB.barcode == barcode).first()
                if product_db:
                    return self._product_db_to_model(product_db)
                return None
            finally:
                db.close()

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
        # Create cache key from search parameters
        cache_key = hashlib.md5(
            f"{query}:{category}:{min_price}:{max_price}:{labels}:{store}".encode()
        ).hexdigest()

        # Try cache first
        cached = cache_service.get_cached_search(cache_key)
        if cached:
            return [Product(**p) for p in cached]

        results = []

        if self._db_available:
            db = self._get_db()
            try:
                query_builder = db.query(ProductDB)

                # Apply filters
                if query:
                    query_lower = f"%{query.lower()}%"
                    query_builder = query_builder.filter(
                        or_(
                            ProductDB.name.ilike(query_lower),
                            ProductDB.description.ilike(query_lower),
                            ProductDB.brand.ilike(query_lower)
                        )
                    )

                if category:
                    query_builder = query_builder.filter(
                        ProductDB.category.ilike(category)
                    )

                if min_price is not None:
                    query_builder = query_builder.filter(ProductDB.price >= min_price)

                if max_price is not None:
                    query_builder = query_builder.filter(ProductDB.price <= max_price)

                if store:
                    query_builder = query_builder.filter(
                        ProductDB.store.ilike(f"%{store}%")
                    )

                products_db = query_builder.all()
                results = [self._product_db_to_model(p) for p in products_db]

                # Filter by labels (JSON field, filter in Python)
                if labels:
                    results = [
                        p for p in results
                        if p.labels and any(
                            label.lower() in [l.lower() for l in p.labels]
                            for label in labels
                        )
                    ]

            finally:
                db.close()
        else:
            # Use in-memory products
            results = self.products.copy()

            if query:
                query_lower = query.lower()
                results = [
                    p for p in results
                    if query_lower in p.name.lower()
                    or (p.description and query_lower in p.description.lower())
                    or (p.brand and query_lower in p.brand.lower())
                ]

            if category:
                results = [p for p in results if p.category.lower() == category.lower()]

            if min_price is not None:
                results = [p for p in results if p.price >= min_price]
            if max_price is not None:
                results = [p for p in results if p.price <= max_price]

            if labels:
                results = [
                    p for p in results
                    if p.labels and any(
                        label.lower() in [l.lower() for l in p.labels]
                        for label in labels
                    )
                ]

            if store:
                results = [
                    p for p in results
                    if p.store and store.lower() in p.store.lower()
                ]

        # Cache results
        cache_service.cache_search_results(cache_key, [p.dict() for p in results])

        return results

    def get_products_by_category(self, category: str) -> List[Product]:
        """Obtiene todos los productos de una categoría"""
        # Try cache first
        cached = cache_service.get_cached_category(category)
        if cached:
            return [Product(**p) for p in cached]

        if self._db_available:
            db = self._get_db()
            try:
                products_db = db.query(ProductDB).filter(
                    ProductDB.category.ilike(category)
                ).all()
                products = [self._product_db_to_model(p) for p in products_db]
                # Cache results
                cache_service.cache_category_products(category, [p.dict() for p in products])
                return products
            finally:
                db.close()

        products = [p for p in self.products if p.category.lower() == category.lower()]
        cache_service.cache_category_products(category, [p.dict() for p in products])
        return products

    def get_categories(self) -> List[str]:
        """Obtiene lista de todas las categorías disponibles"""
        if self._db_available:
            db = self._get_db()
            try:
                categories = db.query(ProductDB.category).distinct().all()
                return sorted([c[0] for c in categories])
            finally:
                db.close()

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
        products = self.get_all_products()
        catalog = {}
        for product in products:
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

    def add_product(self, product_data: dict) -> Optional[Product]:
        """Add a new product to the database"""
        if not self._db_available:
            return None

        db = self._get_db()
        try:
            product_db = ProductDB(**product_data)
            db.add(product_db)
            db.commit()
            db.refresh(product_db)

            # Invalidate cache
            cache_service.invalidate_product_cache()

            return self._product_db_to_model(product_db)
        except Exception as e:
            db.rollback()
            print(f"Error adding product: {e}")
            return None
        finally:
            db.close()

    def update_product(self, product_id: str, product_data: dict) -> Optional[Product]:
        """Update an existing product"""
        if not self._db_available:
            return None

        db = self._get_db()
        try:
            product_db = db.query(ProductDB).filter(ProductDB.id == product_id).first()
            if not product_db:
                return None

            for key, value in product_data.items():
                if hasattr(product_db, key):
                    setattr(product_db, key, value)

            db.commit()
            db.refresh(product_db)

            # Invalidate cache
            cache_service.invalidate_product_cache(product_id)

            return self._product_db_to_model(product_db)
        except Exception as e:
            db.rollback()
            print(f"Error updating product: {e}")
            return None
        finally:
            db.close()

    def delete_product(self, product_id: str) -> bool:
        """Delete a product from the database"""
        if not self._db_available:
            return False

        db = self._get_db()
        try:
            result = db.query(ProductDB).filter(ProductDB.id == product_id).delete()
            db.commit()

            # Invalidate cache
            cache_service.invalidate_product_cache(product_id)

            return result > 0
        except Exception as e:
            db.rollback()
            print(f"Error deleting product: {e}")
            return False
        finally:
            db.close()
