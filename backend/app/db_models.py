"""
SQLAlchemy database models for PostgreSQL
"""

from sqlalchemy import (
    Column, String, Float, Boolean, Integer,
    DateTime, ForeignKey, JSON, Text, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class CategoryDB(Base):
    """Category model"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Relationships
    products = relationship("ProductDB", back_populates="category_rel")


class StoreDB(Base):
    """Store model"""
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(50), nullable=True)
    is_organic = Column(Boolean, default=False)
    is_local = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ProductDB(Base):
    """Product model for database storage"""
    __tablename__ = "products"

    id = Column(String(50), primary_key=True)
    barcode = Column(String(50), nullable=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    brand = Column(String(200), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    unit = Column(String(50), default="unit")
    quantity = Column(Float, default=1.0)
    store = Column(String(200), nullable=True)

    # Nutritional data as JSON
    nutrition = Column(JSON, nullable=True)

    # Sustainability data as JSON
    sustainability = Column(JSON, nullable=True)

    # Product details
    description = Column(Text, nullable=True)
    ingredients = Column(JSON, nullable=True)  # List of strings
    allergens = Column(JSON, nullable=True)    # List of strings
    labels = Column(JSON, nullable=True)       # List of strings

    # Availability
    in_stock = Column(Boolean, default=True)
    stock_location = Column(JSON, nullable=True)  # Dict of store -> availability

    # Media
    image_url = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category_rel = relationship("CategoryDB", back_populates="products")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_product_category_price', 'category', 'price'),
        Index('idx_product_name_search', 'name'),
    )

    def to_dict(self):
        """Convert to dictionary for Pydantic model"""
        return {
            "id": self.id,
            "barcode": self.barcode,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "price": self.price,
            "unit": self.unit,
            "quantity": self.quantity,
            "store": self.store,
            "nutrition": self.nutrition,
            "sustainability": self.sustainability,
            "description": self.description,
            "ingredients": self.ingredients,
            "allergens": self.allergens,
            "labels": self.labels,
            "in_stock": self.in_stock,
            "stock_location": self.stock_location,
            "image_url": self.image_url,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ShoppingListDB(Base):
    """Shopping list model"""
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    user_id = Column(String(100), nullable=True)  # For future user system
    budget = Column(Float, nullable=True)
    optimization_mode = Column(String(50), default="balanced")

    # Items as JSON array
    items = Column(JSON, default=[])

    # Optimization results
    optimized_items = Column(JSON, nullable=True)
    total_cost = Column(Float, nullable=True)
    total_savings = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserPreferencesDB(Base):
    """User preferences for personalized recommendations"""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), unique=True, nullable=False, index=True)

    # Dietary preferences
    dietary_restrictions = Column(JSON, default=[])  # vegan, vegetarian, etc.
    allergens = Column(JSON, default=[])

    # Shopping preferences
    preferred_stores = Column(JSON, default=[])
    preferred_labels = Column(JSON, default=[])  # organic, local, fair-trade

    # Optimization preferences
    price_weight = Column(Float, default=0.4)
    sustainability_weight = Column(Float, default=0.3)
    health_weight = Column(Float, default=0.3)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
