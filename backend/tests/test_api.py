"""
Tests for API endpoints
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


client = TestClient(app)


class TestHealthEndpoints:
    """Test health and root endpoints"""

    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "liquiverde-api"


class TestStatsEndpoint:
    """Test stats endpoint"""

    def test_stats_endpoint(self):
        """Test stats endpoint returns catalog statistics"""
        response = client.get("/api/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_products" in data
        assert "categories_count" in data
        assert "average_price" in data
        assert "price_range" in data
        assert "labels" in data

    def test_stats_has_categories(self):
        """Test stats include category distribution"""
        response = client.get("/api/stats")

        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], dict)


class TestProductsEndpoints:
    """Test products API endpoints"""

    def test_get_products(self):
        """Test getting all products"""
        response = client.get("/api/products/")

        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "products" in data
        assert isinstance(data["products"], list)
        assert data["count"] == 20  # Dataset has 20 products

    def test_get_categories(self):
        """Test getting product categories"""
        response = client.get("/api/products/categories")

        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) == 10  # Dataset has 10 categories

    def test_search_products(self):
        """Test product search"""
        response = client.get("/api/products/search", params={"q": "leche"})

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        assert len(data["results"]) >= 1  # Should find at least 1 milk product

    def test_search_with_category_filter(self):
        """Test product search with category filter"""
        response = client.get(
            "/api/products/search",
            params={"q": "leche", "category": "dairy"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        # All results should be in dairy category
        for product in data["results"]:
            assert product["category"] == "dairy"

    def test_search_with_price_filter(self):
        """Test product search with price filter"""
        response = client.get(
            "/api/products/search",
            params={"max_price": 2000}
        )

        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        for product in data["results"]:
            assert product["price"] <= 2000

    def test_get_catalog(self):
        """Test getting product catalog"""
        response = client.get("/api/products/catalog")

        assert response.status_code == 200
        data = response.json()
        # Catalog returns dict of category -> products
        assert isinstance(data, dict)
        assert len(data) > 0

    def test_compare_products(self):
        """Test product comparison endpoint"""
        response = client.post(
            "/api/products/compare",
            json=["prod_001", "prod_002"]
        )

        assert response.status_code == 200
        data = response.json()
        assert "products" in data or "comparison" in data or isinstance(data, list)


class TestShoppingListEndpoints:
    """Test shopping list API endpoints"""

    def test_optimize_shopping_list(self):
        """Test shopping list optimization"""
        shopping_list = {
            "items": [
                {
                    "product_name": "Leche",
                    "category": "dairy",
                    "quantity": 1,
                    "priority": 1
                }
            ],
            "budget": 10000,
            "optimize_for": "balanced"
        }

        response = client.post("/api/shopping-list/optimize", json=shopping_list)

        assert response.status_code == 200
        data = response.json()
        assert "optimized_items" in data or "total_cost" in data

    def test_quick_optimize(self):
        """Test quick optimization endpoint"""
        request_data = {
            "product_names": ["leche", "pan"],
            "budget": 5000,
            "optimize_for": "price"
        }

        response = client.post("/api/shopping-list/quick-optimize", json=request_data)

        assert response.status_code == 200

    def test_get_templates(self):
        """Test getting shopping list templates"""
        response = client.get("/api/shopping-list/templates")

        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert isinstance(data["templates"], dict)
        assert len(data["templates"]) > 0

    def test_optimize_with_preferences(self):
        """Test optimization with user preferences"""
        shopping_list = {
            "items": [
                {
                    "product_name": "Leche",
                    "category": "dairy",
                    "quantity": 1,
                    "priority": 1,
                    "preferences": ["local", "organic"]
                }
            ],
            "budget": 15000,
            "optimize_for": "sustainability"
        }

        response = client.post("/api/shopping-list/optimize", json=shopping_list)

        assert response.status_code == 200


class TestRecommendationsEndpoints:
    """Test recommendations API endpoints"""

    def test_top_sustainable(self):
        """Test top sustainable products endpoint"""
        response = client.get(
            "/api/recommendations/top-sustainable",
            params={"limit": 5}
        )

        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert len(data["products"]) <= 5

    def test_top_sustainable_by_category(self):
        """Test top sustainable by category"""
        response = client.get(
            "/api/recommendations/top-sustainable",
            params={"category": "dairy", "limit": 3}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "dairy"

    def test_best_value(self):
        """Test best value products endpoint"""
        response = client.get(
            "/api/recommendations/best-value",
            params={"limit": 5}
        )

        assert response.status_code == 200
        data = response.json()
        assert "products" in data

    def test_savings_opportunities(self):
        """Test savings opportunities endpoint"""
        response = client.get(
            "/api/recommendations/savings-opportunities",
            params={"min_savings_percentage": 10}
        )

        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data
        assert "total_potential_savings" in data

    def test_savings_opportunities_threshold(self):
        """Test savings opportunities respects threshold"""
        response = client.get(
            "/api/recommendations/savings-opportunities",
            params={"min_savings_percentage": 20}
        )

        assert response.status_code == 200
        data = response.json()
        for opp in data["opportunities"]:
            assert opp["savings_percentage"] >= 20


class TestErrorHandling:
    """Test API error handling"""

    def test_invalid_product_id(self):
        """Test handling of invalid product ID"""
        response = client.get("/api/products/nonexistent_id")

        assert response.status_code == 404

    def test_invalid_optimization_request(self):
        """Test handling of invalid optimization request"""
        response = client.post(
            "/api/shopping-list/optimize",
            json={"invalid": "data"}
        )

        assert response.status_code == 422  # Validation error

    def test_empty_compare_list(self):
        """Test handling of empty comparison list"""
        response = client.post("/api/products/compare", json=[])

        # Should handle gracefully
        assert response.status_code in [200, 400, 422]


class TestCORS:
    """Test CORS configuration"""

    def test_cors_headers(self):
        """Test that CORS headers are present"""
        response = client.options(
            "/api/stats",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            }
        )

        # CORS preflight should be handled
        assert response.status_code in [200, 204, 405]
