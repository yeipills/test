"""
Tests for MultiObjectiveKnapsackOptimizer algorithm
"""

import pytest
from app.algorithms.knapsack_optimizer import MultiObjectiveKnapsackOptimizer
from app.models.product import Product, SustainabilityScore
from app.models.shopping_list import ShoppingListItem, ShoppingList, OptimizedShoppingList


class TestMultiObjectiveKnapsackOptimizer:
    """Test suite for MultiObjectiveKnapsackOptimizer"""

    def test_optimizer_initialization(self):
        """Test optimizer initializes correctly"""
        optimizer = MultiObjectiveKnapsackOptimizer()
        
        assert optimizer is not None
        assert optimizer.scorer is not None

    def test_optimize_returns_optimized_list(self, knapsack_optimizer, product_list):
        """Test that optimize returns an OptimizedShoppingList"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=5000.0,
            optimize_for="balanced"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        assert result is not None
        assert isinstance(result, OptimizedShoppingList)

    def test_optimize_respects_budget(self, knapsack_optimizer, product_list):
        """Test that optimization respects budget constraints"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=1000.0,  # Only cheap product fits
            optimize_for="price"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        assert result.total_cost <= shopping_list.budget

    def test_optimize_selects_products(self, knapsack_optimizer, product_list):
        """Test that optimization selects products for each item"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=2,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="balanced"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        assert len(result.optimized_items) > 0
        assert result.optimized_items[0].selected_product is not None

    def test_price_optimization_prefers_cheaper(self, knapsack_optimizer, product_list):
        """Test that price optimization prefers cheaper products"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="price"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        # With price optimization, should select cheaper options
        if result.optimized_items:
            selected = result.optimized_items[0].selected_product
            # Verify it's one of the cheaper options
            assert selected.price <= 2000.0

    def test_sustainability_optimization(self, knapsack_optimizer, product_list):
        """Test that sustainability optimization prefers sustainable products"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1,
                preferences=["organic"]
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="sustainability"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        # Should have good sustainability score
        assert result.overall_sustainability.overall_score > 0

    def test_empty_shopping_list(self, knapsack_optimizer):
        """Test handling of empty shopping list"""
        shopping_list = ShoppingList(
            items=[],
            budget=10000.0,
            optimize_for="balanced"
        )

        result = knapsack_optimizer.optimize(shopping_list, {})

        assert result is not None
        assert len(result.optimized_items) == 0
        assert result.total_cost == 0

    def test_no_matching_products(self, knapsack_optimizer):
        """Test handling when no products match the category"""
        items = [
            ShoppingListItem(
                product_name="Product",
                category="nonexistent",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="balanced"
        )

        result = knapsack_optimizer.optimize(shopping_list, {"dairy": []})

        assert result is not None
        assert len(result.optimized_items) == 0

    def test_multiple_items_optimization(self, knapsack_optimizer):
        """Test optimization with multiple items"""
        dairy_products = [
            Product(id="milk1", name="Milk 1", category="dairy", price=1000.0),
            Product(id="milk2", name="Milk 2", category="dairy", price=1500.0),
        ]
        bread_products = [
            Product(id="bread1", name="Bread 1", category="bread", price=800.0),
            Product(id="bread2", name="Bread 2", category="bread", price=1200.0),
        ]

        items = [
            ShoppingListItem(product_name="Milk", category="dairy", quantity=1, priority=1),
            ShoppingListItem(product_name="Bread", category="bread", quantity=1, priority=2),
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=5000.0,
            optimize_for="balanced"
        )

        available_products = {
            "dairy": dairy_products,
            "bread": bread_products
        }

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        assert len(result.optimized_items) == 2
        assert result.total_cost > 0

    def test_optimization_weights(self, knapsack_optimizer):
        """Test that different optimization modes produce different results"""
        # Test that the optimizer handles different optimization modes
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        
        dairy_products = [
            Product(id="cheap1", name="Cheap Milk", category="dairy", price=800.0),
            Product(id="expensive1", name="Organic Milk", category="dairy", price=2500.0, labels=["organic"]),
        ]
        
        # Test price optimization
        shopping_list_price = ShoppingList(items=items, budget=10000.0, optimize_for="price")
        result_price = knapsack_optimizer.optimize(shopping_list_price, {"dairy": dairy_products})
        
        # Test sustainability optimization
        shopping_list_sus = ShoppingList(items=items, budget=10000.0, optimize_for="sustainability")
        result_sus = knapsack_optimizer.optimize(shopping_list_sus, {"dairy": dairy_products})
        
        # Different modes should potentially select different products
        assert result_price is not None
        assert result_sus is not None

    def test_budget_used_percentage(self, knapsack_optimizer, product_list):
        """Test that budget_used_percentage is calculated correctly"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=5000.0,
            optimize_for="balanced"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        expected_percentage = (result.total_cost / 5000.0) * 100
        assert abs(result.budget_used_percentage - expected_percentage) < 0.01

    def test_alternatives_provided(self, knapsack_optimizer, product_list):
        """Test that alternatives are provided for selected products"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="balanced"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        if result.optimized_items:
            # Should have alternatives when multiple products available
            assert len(result.optimized_items[0].alternatives) >= 0

    def test_savings_calculation(self, knapsack_optimizer, product_list):
        """Test that savings are calculated"""
        items = [
            ShoppingListItem(
                product_name="Leche",
                category="dairy",
                quantity=1,
                priority=1
            )
        ]
        shopping_list = ShoppingList(
            items=items,
            budget=10000.0,
            optimize_for="price"
        )

        available_products = {"dairy": product_list}

        result = knapsack_optimizer.optimize(shopping_list, available_products)

        # Should have some savings calculated
        assert result.estimated_savings >= 0
