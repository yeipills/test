from .products import router as products_router
from .shopping_list import router as shopping_list_router
from .recommendations import router as recommendations_router

__all__ = ["products_router", "shopping_list_router", "recommendations_router"]
