"""
Redis cache service for caching frequently accessed data
"""

import redis
import json
import os
from typing import Any, Optional
from functools import wraps

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Redis client
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


class CacheService:
    """Service for caching with Redis"""

    # Cache key prefixes
    PRODUCT_PREFIX = "product:"
    SEARCH_PREFIX = "search:"
    CATEGORY_PREFIX = "category:"
    STATS_PREFIX = "stats:"
    OPTIMIZATION_PREFIX = "optimization:"

    # Default TTL in seconds
    DEFAULT_TTL = 3600  # 1 hour
    SHORT_TTL = 300     # 5 minutes
    LONG_TTL = 86400    # 24 hours

    def __init__(self):
        self.client = redis_client

    def is_available(self) -> bool:
        """Check if Redis is available"""
        try:
            return self.client.ping()
        except:
            return False

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Redis GET error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with optional TTL"""
        try:
            ttl = ttl or self.DEFAULT_TTL
            serialized = json.dumps(value, default=str)
            return self.client.setex(key, ttl, serialized)
        except Exception as e:
            print(f"Redis SET error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return self.client.delete(key) > 0
        except Exception as e:
            print(f"Redis DELETE error: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Redis DELETE PATTERN error: {e}")
            return 0

    def clear_all(self) -> bool:
        """Clear all cache (use with caution)"""
        try:
            return self.client.flushdb()
        except Exception as e:
            print(f"Redis FLUSH error: {e}")
            return False

    # Specific cache methods

    def cache_product(self, product_id: str, product_data: dict) -> bool:
        """Cache a product"""
        key = f"{self.PRODUCT_PREFIX}{product_id}"
        return self.set(key, product_data, self.LONG_TTL)

    def get_cached_product(self, product_id: str) -> Optional[dict]:
        """Get cached product"""
        key = f"{self.PRODUCT_PREFIX}{product_id}"
        return self.get(key)

    def cache_search_results(self, query_hash: str, results: list) -> bool:
        """Cache search results"""
        key = f"{self.SEARCH_PREFIX}{query_hash}"
        return self.set(key, results, self.SHORT_TTL)

    def get_cached_search(self, query_hash: str) -> Optional[list]:
        """Get cached search results"""
        key = f"{self.SEARCH_PREFIX}{query_hash}"
        return self.get(key)

    def cache_category_products(self, category: str, products: list) -> bool:
        """Cache products by category"""
        key = f"{self.CATEGORY_PREFIX}{category.lower()}"
        return self.set(key, products, self.DEFAULT_TTL)

    def get_cached_category(self, category: str) -> Optional[list]:
        """Get cached category products"""
        key = f"{self.CATEGORY_PREFIX}{category.lower()}"
        return self.get(key)

    def cache_stats(self, stats: dict) -> bool:
        """Cache API stats"""
        key = f"{self.STATS_PREFIX}general"
        return self.set(key, stats, self.SHORT_TTL)

    def get_cached_stats(self) -> Optional[dict]:
        """Get cached stats"""
        key = f"{self.STATS_PREFIX}general"
        return self.get(key)

    def cache_optimization(self, optimization_hash: str, result: dict) -> bool:
        """Cache optimization results"""
        key = f"{self.OPTIMIZATION_PREFIX}{optimization_hash}"
        return self.set(key, result, self.DEFAULT_TTL)

    def get_cached_optimization(self, optimization_hash: str) -> Optional[dict]:
        """Get cached optimization"""
        key = f"{self.OPTIMIZATION_PREFIX}{optimization_hash}"
        return self.get(key)

    def invalidate_product_cache(self, product_id: str = None):
        """Invalidate product cache"""
        if product_id:
            self.delete(f"{self.PRODUCT_PREFIX}{product_id}")
        else:
            self.delete_pattern(f"{self.PRODUCT_PREFIX}*")
        # Also invalidate related caches
        self.delete_pattern(f"{self.CATEGORY_PREFIX}*")
        self.delete_pattern(f"{self.SEARCH_PREFIX}*")


# Helper decorator for caching function results
def cached(prefix: str, ttl: int = 3600):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = CacheService()
            if not cache.is_available():
                return func(*args, **kwargs)

            # Create cache key from function name and arguments
            cache_key = f"{prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


# Global cache service instance
cache_service = CacheService()
