from pydantic import BaseModel, Field
from typing import List, Optional
from .product import Product


class ProductRecommendation(BaseModel):
    """Product recommendation based on user preferences and history"""
    product: Product
    confidence_score: float = Field(..., ge=0, le=1)
    reason: str
    category: str  # similar, cheaper, healthier, more_sustainable
    estimated_savings: Optional[float] = 0.0


class SubstitutionSuggestion(BaseModel):
    """Intelligent product substitution suggestion"""
    original_product: Product
    suggested_product: Product
    substitution_score: float = Field(..., ge=0, le=100, description="How good the substitution is")

    # Comparison metrics
    price_difference: float
    price_difference_percentage: float
    sustainability_improvement: float
    health_improvement: float

    # Justification
    reasons: List[str]
    trade_offs: List[str] = []

    # Categories
    substitution_type: str  # same_product_different_brand, similar_category, healthier_alternative
    confidence: str = "high"  # high, medium, low


class RewardCalculation(BaseModel):
    """Sustainability rewards calculation"""
    user_id: Optional[str] = None
    points_earned: int
    carbon_saved_kg: float
    money_saved: float
    level: str = "bronze"  # bronze, silver, gold, platinum
    achievements: List[str] = []
