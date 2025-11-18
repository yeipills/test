"""
Tests for SustainabilityScorer algorithm
"""

import pytest
from app.algorithms.sustainability_scorer import SustainabilityScorer
from app.models.product import Product, NutritionInfo, SustainabilityScore


class TestSustainabilityScorer:
    """Test suite for SustainabilityScorer"""

    def test_calculate_score_returns_valid_score(self, sustainability_scorer, sample_product):
        """Test that calculate_score returns a valid SustainabilityScore"""
        score = sustainability_scorer.calculate_score(sample_product)

        assert score is not None
        assert isinstance(score, SustainabilityScore)
        assert 0 <= score.overall_score <= 100
        assert 0 <= score.economic_score <= 100
        assert 0 <= score.environmental_score <= 100
        assert 0 <= score.social_score <= 100
        assert 0 <= score.health_score <= 100

    def test_organic_product_has_higher_environmental_score(
        self, sustainability_scorer, sample_product, sample_product_organic
    ):
        """Test that organic products get higher environmental scores"""
        regular_score = sustainability_scorer.calculate_score(sample_product)
        organic_score = sustainability_scorer.calculate_score(sample_product_organic)

        assert organic_score.environmental_score > regular_score.environmental_score

    def test_fair_trade_improves_social_score(
        self, sustainability_scorer, sample_product, sample_product_organic
    ):
        """Test that fair trade products get higher social scores"""
        regular_score = sustainability_scorer.calculate_score(sample_product)
        fair_trade_score = sustainability_scorer.calculate_score(sample_product_organic)

        assert fair_trade_score.social_score > regular_score.social_score

    def test_cheaper_product_has_higher_economic_score(
        self, sustainability_scorer, sample_product, sample_product_cheap
    ):
        """Test that cheaper products get higher economic scores"""
        regular_score = sustainability_scorer.calculate_score(sample_product)
        cheap_score = sustainability_scorer.calculate_score(sample_product_cheap)

        assert cheap_score.economic_score > regular_score.economic_score

    def test_local_product_bonus(self, sustainability_scorer, sample_product, sample_product_cheap):
        """Test that local products get social score bonus"""
        local_score = sustainability_scorer.calculate_score(sample_product)
        non_local_score = sustainability_scorer.calculate_score(sample_product_cheap)

        # Local product should have higher social score
        assert local_score.social_score > non_local_score.social_score

    def test_recyclable_packaging_bonus(self, sustainability_scorer, sample_product, sample_product_cheap):
        """Test that recyclable packaging improves environmental score"""
        recyclable_score = sustainability_scorer.calculate_score(sample_product)
        non_recyclable_score = sustainability_scorer.calculate_score(sample_product_cheap)

        assert recyclable_score.environmental_score > non_recyclable_score.environmental_score

    def test_carbon_footprint_affects_environmental_score(self, sustainability_scorer):
        """Test that lower carbon footprint results in higher environmental score"""
        low_carbon = Product(
            id="low_carbon",
            name="Low Carbon Product",
            category="test",
            price=1000.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=0.5,
                water_usage_liters=20.0,
                packaging_recyclable=True,
                local_product=True
            )
        )

        high_carbon = Product(
            id="high_carbon",
            name="High Carbon Product",
            category="test",
            price=1000.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=5.0,
                water_usage_liters=20.0,
                packaging_recyclable=True,
                local_product=True
            )
        )

        low_score = sustainability_scorer.calculate_score(low_carbon)
        high_score = sustainability_scorer.calculate_score(high_carbon)

        assert low_score.environmental_score > high_score.environmental_score

    def test_health_score_considers_nutrition(self, sustainability_scorer):
        """Test that health score considers nutritional content"""
        healthy = Product(
            id="healthy",
            name="Healthy Product",
            category="test",
            price=1000.0,
            nutrition=NutritionInfo(
                energy_kcal=100.0,
                proteins=10.0,
                carbohydrates=20.0,
                fats=2.0,
                fiber=5.0,
                salt=0.1
            ),
            labels=["organic", "whole grain"]
        )

        unhealthy = Product(
            id="unhealthy",
            name="Unhealthy Product",
            category="test",
            price=1000.0,
            nutrition=NutritionInfo(
                energy_kcal=500.0,
                proteins=2.0,
                carbohydrates=80.0,
                fats=20.0,
                fiber=0.0,
                salt=2.0
            ),
            labels=[]
        )

        healthy_score = sustainability_scorer.calculate_score(healthy)
        unhealthy_score = sustainability_scorer.calculate_score(unhealthy)

        assert healthy_score.health_score > unhealthy_score.health_score

    def test_custom_weights(self):
        """Test scorer with custom weights"""
        custom_weights = {
            "economic": 0.5,
            "environmental": 0.2,
            "social": 0.2,
            "health": 0.1
        }
        scorer = SustainabilityScorer(weights=custom_weights)

        product = Product(
            id="test",
            name="Test Product",
            category="test",
            price=500.0,  # Very cheap
            sustainability=SustainabilityScore(
                carbon_footprint_kg=5.0,  # High carbon
                local_product=False
            )
        )

        score = scorer.calculate_score(product)

        # With high economic weight, cheap product should still score well
        assert score.overall_score > 50

    def test_score_preserves_raw_sustainability_data(self, sustainability_scorer, sample_product):
        """Test that calculated score preserves raw sustainability data"""
        score = sustainability_scorer.calculate_score(sample_product)

        assert score.carbon_footprint_kg == sample_product.sustainability.carbon_footprint_kg
        assert score.water_usage_liters == sample_product.sustainability.water_usage_liters
        assert score.packaging_recyclable == sample_product.sustainability.packaging_recyclable
        assert score.fair_trade == sample_product.sustainability.fair_trade
        assert score.local_product == sample_product.sustainability.local_product

    def test_product_without_nutrition_still_scores(self, sustainability_scorer):
        """Test that products without nutrition data can still be scored"""
        product = Product(
            id="no_nutrition",
            name="No Nutrition Product",
            category="test",
            price=1000.0,
            nutrition=None
        )

        score = sustainability_scorer.calculate_score(product)

        assert score is not None
        assert 0 <= score.overall_score <= 100

    def test_product_without_sustainability_data_still_scores(self, sustainability_scorer):
        """Test that products without sustainability data can still be scored"""
        product = Product(
            id="no_sus",
            name="No Sustainability Product",
            category="test",
            price=1000.0,
            sustainability=None
        )

        score = sustainability_scorer.calculate_score(product)

        assert score is not None
        assert 0 <= score.overall_score <= 100
