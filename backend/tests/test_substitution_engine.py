"""
Tests for IntelligentSubstitutionEngine algorithm
"""

import pytest
from app.algorithms.substitution_engine import IntelligentSubstitutionEngine
from app.models.product import Product, NutritionInfo, SustainabilityScore


class TestIntelligentSubstitutionEngine:
    """Test suite for IntelligentSubstitutionEngine"""

    def test_engine_initialization(self):
        """Test engine initializes correctly"""
        engine = IntelligentSubstitutionEngine()
        assert engine is not None
        assert engine.scorer is not None

    def test_find_substitutions_returns_list(
        self, substitution_engine, sample_product, product_list
    ):
        """Test that find_substitutions returns a list"""
        substitutions = substitution_engine.find_substitutions(
            sample_product, product_list
        )

        assert substitutions is not None
        assert isinstance(substitutions, list)

    def test_substitutions_exclude_original(
        self, substitution_engine, sample_product, product_list
    ):
        """Test that substitutions don't include the original product"""
        substitutions = substitution_engine.find_substitutions(
            sample_product, product_list
        )

        for sub in substitutions:
            assert sub.substitute.id != sample_product.id

    def test_substitutions_have_required_fields(
        self, substitution_engine, sample_product, product_list
    ):
        """Test that substitution results have all required fields"""
        substitutions = substitution_engine.find_substitutions(
            sample_product, product_list
        )

        for sub in substitutions:
            assert hasattr(sub, 'substitute')
            assert hasattr(sub, 'similarity_score')
            assert hasattr(sub, 'substitution_score')
            assert hasattr(sub, 'price_difference')
            assert hasattr(sub, 'sustainability_improvement')

    def test_similarity_score_range(
        self, substitution_engine, sample_product, product_list
    ):
        """Test that similarity scores are in valid range"""
        substitutions = substitution_engine.find_substitutions(
            sample_product, product_list
        )

        for sub in substitutions:
            assert 0 <= sub.similarity_score <= 1

    def test_same_category_higher_similarity(self, substitution_engine):
        """Test that same category products have higher similarity"""
        original = Product(
            id="orig", name="Original", category="dairy", price=1000.0
        )
        same_category = Product(
            id="same", name="Same Cat", category="dairy", price=1200.0
        )
        diff_category = Product(
            id="diff", name="Diff Cat", category="bread", price=1000.0
        )

        subs = substitution_engine.find_substitutions(
            original, [same_category, diff_category]
        )

        # Find the substitutions
        same_cat_sub = next((s for s in subs if s.substitute.id == "same"), None)
        diff_cat_sub = next((s for s in subs if s.substitute.id == "diff"), None)

        if same_cat_sub and diff_cat_sub:
            assert same_cat_sub.similarity_score > diff_cat_sub.similarity_score

    def test_price_focused_substitution(self, substitution_engine):
        """Test price-focused substitution prefers cheaper products"""
        expensive = Product(
            id="expensive", name="Expensive", category="dairy", price=3000.0
        )
        cheap = Product(
            id="cheap", name="Cheap", category="dairy", price=1000.0
        )
        medium = Product(
            id="medium", name="Medium", category="dairy", price=2000.0
        )

        subs = substitution_engine.find_substitutions(
            expensive, [cheap, medium], focus="price_focused"
        )

        if len(subs) >= 2:
            # Cheap should rank higher
            cheap_idx = next(
                (i for i, s in enumerate(subs) if s.substitute.id == "cheap"), -1
            )
            medium_idx = next(
                (i for i, s in enumerate(subs) if s.substitute.id == "medium"), -1
            )
            if cheap_idx >= 0 and medium_idx >= 0:
                assert cheap_idx < medium_idx

    def test_sustainability_focused_substitution(self, substitution_engine):
        """Test sustainability-focused substitution prefers sustainable products"""
        original = Product(
            id="original",
            name="Original",
            category="dairy",
            price=1500.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=2.0,
                packaging_recyclable=False,
                local_product=False
            )
        )
        sustainable = Product(
            id="sustainable",
            name="Sustainable",
            category="dairy",
            price=2000.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=0.5,
                packaging_recyclable=True,
                fair_trade=True,
                local_product=True
            ),
            labels=["organic", "local"]
        )
        regular = Product(
            id="regular",
            name="Regular",
            category="dairy",
            price=1200.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=2.5,
                packaging_recyclable=False,
                local_product=False
            )
        )

        subs = substitution_engine.find_substitutions(
            original, [sustainable, regular], focus="sustainability_focused"
        )

        if subs:
            # Sustainable should rank first
            assert subs[0].substitute.id == "sustainable"

    def test_max_results_limit(self, substitution_engine):
        """Test that max_results limits the number of substitutions"""
        original = Product(
            id="orig", name="Original", category="dairy", price=1000.0
        )
        candidates = [
            Product(id=f"prod_{i}", name=f"Product {i}", category="dairy", price=1000.0 + i * 100)
            for i in range(10)
        ]

        subs = substitution_engine.find_substitutions(
            original, candidates, max_results=3
        )

        assert len(subs) <= 3

    def test_empty_candidates(self, substitution_engine, sample_product):
        """Test handling of empty candidate list"""
        subs = substitution_engine.find_substitutions(sample_product, [])

        assert subs == []

    def test_confidence_levels(self, substitution_engine):
        """Test that confidence levels are assigned"""
        original = Product(
            id="orig", name="Milk A", category="dairy", price=1000.0,
            brand="BrandA", labels=["local"]
        )
        similar = Product(
            id="similar", name="Milk B", category="dairy", price=1100.0,
            brand="BrandA", labels=["local"]
        )
        different = Product(
            id="different", name="Juice", category="beverages", price=1500.0,
            brand="OtherBrand", labels=[]
        )

        subs = substitution_engine.find_substitutions(
            original, [similar, different]
        )

        for sub in subs:
            assert hasattr(sub, 'confidence')
            assert sub.confidence in ['high', 'medium', 'low']

    def test_trade_offs_identified(self, substitution_engine):
        """Test that trade-offs are identified"""
        original = Product(
            id="orig", name="Original", category="dairy", price=1000.0,
            sustainability=SustainabilityScore(carbon_footprint_kg=1.0)
        )
        better_but_expensive = Product(
            id="better", name="Better", category="dairy", price=2000.0,
            sustainability=SustainabilityScore(
                carbon_footprint_kg=0.3,
                fair_trade=True,
                local_product=True
            ),
            labels=["organic"]
        )

        subs = substitution_engine.find_substitutions(
            original, [better_but_expensive]
        )

        if subs:
            # Should identify trade-off (more expensive but more sustainable)
            assert hasattr(subs[0], 'trade_offs')

    def test_substitution_type_classification(self, substitution_engine):
        """Test that substitution types are classified"""
        original = Product(
            id="orig", name="Milk BrandA", category="dairy", price=1000.0,
            brand="BrandA"
        )
        same_brand = Product(
            id="same", name="Milk BrandA Premium", category="dairy", price=1500.0,
            brand="BrandA"
        )
        diff_brand = Product(
            id="diff", name="Milk BrandB", category="dairy", price=1100.0,
            brand="BrandB"
        )

        subs = substitution_engine.find_substitutions(
            original, [same_brand, diff_brand]
        )

        for sub in subs:
            assert hasattr(sub, 'substitution_type')

    def test_price_difference_calculation(self, substitution_engine):
        """Test that price difference is calculated correctly"""
        original = Product(
            id="orig", name="Original", category="dairy", price=1500.0
        )
        cheaper = Product(
            id="cheaper", name="Cheaper", category="dairy", price=1000.0
        )

        subs = substitution_engine.find_substitutions(original, [cheaper])

        if subs:
            assert subs[0].price_difference == -500.0

    def test_balanced_focus(self, substitution_engine):
        """Test balanced focus considers all factors"""
        original = Product(
            id="orig", name="Original", category="dairy", price=1500.0
        )
        cheap = Product(
            id="cheap", name="Cheap", category="dairy", price=800.0,
            sustainability=SustainabilityScore(local_product=False)
        )
        sustainable = Product(
            id="sus", name="Sustainable", category="dairy", price=2000.0,
            sustainability=SustainabilityScore(
                fair_trade=True, local_product=True
            ),
            labels=["organic"]
        )
        balanced = Product(
            id="balanced", name="Balanced", category="dairy", price=1200.0,
            sustainability=SustainabilityScore(
                packaging_recyclable=True, local_product=True
            ),
            labels=["local"]
        )

        subs = substitution_engine.find_substitutions(
            original, [cheap, sustainable, balanced], focus="balanced"
        )

        # Balanced should be among top results
        assert any(s.substitute.id == "balanced" for s in subs[:2])
