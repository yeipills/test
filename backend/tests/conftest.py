"""
Pytest fixtures for LiquiVerde tests
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.product import Product, NutritionInfo, SustainabilityScore
from app.models.shopping_list import ShoppingListItem, ShoppingList
from app.algorithms.sustainability_scorer import SustainabilityScorer
from app.algorithms.knapsack_optimizer import MultiObjectiveKnapsackOptimizer
from app.algorithms.substitution_engine import IntelligentSubstitutionEngine


@pytest.fixture
def sample_product():
    """Create a sample product for testing"""
    return Product(
        id="test_001",
        barcode="1234567890123",
        name="Leche Entera Test 1L",
        brand="TestBrand",
        category="dairy",
        price=1500.0,
        unit="liter",
        quantity=1.0,
        store="Test Store",
        nutrition=NutritionInfo(
            energy_kcal=65.0,
            proteins=3.5,
            carbohydrates=5.0,
            fats=3.5,
            fiber=0.0,
            salt=0.1
        ),
        sustainability=SustainabilityScore(
            carbon_footprint_kg=1.2,
            water_usage_liters=35.0,
            packaging_recyclable=True,
            fair_trade=False,
            local_product=True
        ),
        labels=["local", "fresh"],
        in_stock=True
    )


@pytest.fixture
def sample_product_organic():
    """Create a sample organic product for testing"""
    return Product(
        id="test_002",
        barcode="1234567890124",
        name="Leche Orgánica Test 1L",
        brand="OrganicBrand",
        category="dairy",
        price=2500.0,
        unit="liter",
        quantity=1.0,
        store="Test Store",
        nutrition=NutritionInfo(
            energy_kcal=60.0,
            proteins=3.2,
            carbohydrates=4.8,
            fats=3.2,
            fiber=0.0,
            salt=0.1
        ),
        sustainability=SustainabilityScore(
            carbon_footprint_kg=0.8,
            water_usage_liters=30.0,
            packaging_recyclable=True,
            fair_trade=True,
            local_product=True
        ),
        labels=["organic", "local", "fair trade"],
        in_stock=True
    )


@pytest.fixture
def sample_product_cheap():
    """Create a cheap product for testing"""
    return Product(
        id="test_003",
        barcode="1234567890125",
        name="Leche Económica Test 1L",
        brand="EconomyBrand",
        category="dairy",
        price=990.0,
        unit="liter",
        quantity=1.0,
        store="Test Store",
        nutrition=NutritionInfo(
            energy_kcal=62.0,
            proteins=3.0,
            carbohydrates=5.2,
            fats=3.0,
            fiber=0.0,
            salt=0.15
        ),
        sustainability=SustainabilityScore(
            carbon_footprint_kg=1.5,
            water_usage_liters=40.0,
            packaging_recyclable=False,
            fair_trade=False,
            local_product=False
        ),
        labels=[],
        in_stock=True
    )


@pytest.fixture
def product_list(sample_product, sample_product_organic, sample_product_cheap):
    """Create a list of products for testing"""
    return [sample_product, sample_product_organic, sample_product_cheap]


@pytest.fixture
def sustainability_scorer():
    """Create a SustainabilityScorer instance"""
    return SustainabilityScorer()


@pytest.fixture
def knapsack_optimizer():
    """Create a MultiObjectiveKnapsackOptimizer instance"""
    return MultiObjectiveKnapsackOptimizer()


@pytest.fixture
def substitution_engine():
    """Create an IntelligentSubstitutionEngine instance"""
    return IntelligentSubstitutionEngine()


@pytest.fixture
def sample_shopping_list():
    """Create a sample shopping list for testing"""
    items = [
        ShoppingListItem(
            product_name="Leche",
            category="dairy",
            quantity=2,
            priority=1,
            preferences=["local"]
        ),
        ShoppingListItem(
            product_name="Pan",
            category="bread",
            quantity=1,
            priority=2,
            preferences=[]
        )
    ]
    return ShoppingList(
        items=items,
        budget=10000.0,
        optimize_for="balanced"
    )
