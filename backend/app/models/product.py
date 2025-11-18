from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class NutritionInfo(BaseModel):
    """Nutritional information per 100g"""
    energy_kcal: Optional[float] = 0
    proteins: Optional[float] = 0
    carbohydrates: Optional[float] = 0
    fats: Optional[float] = 0
    fiber: Optional[float] = 0
    salt: Optional[float] = 0


class SustainabilityScore(BaseModel):
    """Multi-dimensional sustainability scoring"""
    economic_score: float = Field(..., ge=0, le=100, description="Price efficiency score")
    environmental_score: float = Field(..., ge=0, le=100, description="Environmental impact score")
    social_score: float = Field(..., ge=0, le=100, description="Social responsibility score")
    health_score: float = Field(..., ge=0, le=100, description="Nutritional health score")
    overall_score: float = Field(..., ge=0, le=100, description="Weighted overall score")

    carbon_footprint_kg: Optional[float] = Field(None, description="CO2 kg per unit")
    water_usage_liters: Optional[float] = Field(None, description="Water liters per unit")
    packaging_recyclable: Optional[bool] = False
    fair_trade: Optional[bool] = False
    local_product: Optional[bool] = False


class Product(BaseModel):
    """Product model with all relevant information"""
    id: str
    barcode: Optional[str] = None
    name: str
    brand: Optional[str] = None
    category: str
    price: float = Field(..., gt=0)
    unit: str = "unit"  # unit, kg, liter, etc.
    quantity: float = 1.0
    store: Optional[str] = None

    # Nutritional data
    nutrition: Optional[NutritionInfo] = None

    # Sustainability data
    sustainability: Optional[SustainabilityScore] = None

    # Product details
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    allergens: Optional[List[str]] = None
    labels: Optional[List[str]] = None  # organic, vegan, gluten-free, etc.

    # Availability
    in_stock: bool = True
    stock_location: Optional[Dict[str, bool]] = None  # store -> availability

    # Metadata
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ProductAnalysis(BaseModel):
    """Comprehensive product analysis result"""
    product: Product
    sustainability: SustainabilityScore
    alternatives: List['Product'] = []
    savings_potential: float = 0.0  # potential savings in currency
    environmental_impact: str = "medium"  # low, medium, high
    recommendation: str = ""
    health_rating: str = "good"  # excellent, good, average, poor
