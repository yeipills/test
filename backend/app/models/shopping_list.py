from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from .product import Product, SustainabilityScore


class ShoppingListItem(BaseModel):
    """Item in a shopping list"""
    product_id: Optional[str] = None
    product_name: str
    category: str
    quantity: float = 1.0
    unit: str = "unit"
    priority: int = Field(1, ge=1, le=5, description="1=essential, 5=optional")
    max_price: Optional[float] = None  # maximum willing to pay
    preferences: Optional[List[str]] = []  # organic, local, etc.


class ShoppingList(BaseModel):
    """Shopping list input"""
    items: List[ShoppingListItem]
    budget: Optional[float] = None  # total budget constraint
    optimize_for: str = "balanced"  # balanced, price, sustainability, health
    store_preference: Optional[List[str]] = None


class OptimizedProduct(BaseModel):
    """Optimized product selection for shopping list"""
    original_item: ShoppingListItem
    selected_product: Product
    alternatives: List[Product] = []
    reason: str
    savings: float = 0.0
    sustainability_impact: str = "neutral"


class OptimizedShoppingList(BaseModel):
    """Optimized shopping list result"""
    original_list: ShoppingList
    optimized_items: List[OptimizedProduct]

    # Summary metrics
    total_cost: float
    estimated_savings: float
    budget_used_percentage: float
    overall_sustainability: SustainabilityScore

    # Environmental impact
    total_carbon_footprint: float = 0.0
    total_water_usage: float = 0.0
    recyclable_percentage: float = 0.0

    # Optimization details
    optimization_algorithm: str
    constraints_met: bool
    items_substituted: int = 0
    optimization_score: float = Field(..., ge=0, le=100)

    # Shopping route
    recommended_stores: List[str] = []
    estimated_shopping_time: Optional[int] = None  # minutes

    # Warnings and feedback
    warnings: List[str] = []
    items_not_found: List[str] = []

    created_at: datetime = Field(default_factory=datetime.now)
