"""
Simple in-memory cache for flight search results.
Identified by tripId, with TTL expiration.
"""
import time
from typing import Dict, Optional, Any
from dataclasses import dataclass


@dataclass
class CacheEntry:
    """A cached item with expiration."""
    data: Any
    expires_at: float
    created_at: float


class FlightCache:
    """
    In-memory cache for flight results.
    Each entry is identified by tripId and expires after TTL.
    """
    
    def __init__(self, default_ttl_seconds: int = 900):  # 15 minutes
        self._cache: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl_seconds
    
    def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store data with TTL."""
        ttl = ttl_seconds or self.default_ttl
        now = time.time()
        self._cache[key] = CacheEntry(
            data=data,
            expires_at=now + ttl,
            created_at=now
        )
        # Cleanup expired entries on set (lazy cleanup)
        self._cleanup_expired()
    
    def get(self, key: str) -> Optional[Any]:
        """Get data if exists and not expired."""
        entry = self._cache.get(key)
        if not entry:
            return None
        
        if time.time() > entry.expires_at:
            del self._cache[key]
            return None
        
        return entry.data
    
    def get_page(self, key: str, page: int, page_size: int = 10) -> Optional[Dict]:
        """Get a specific page of cached results."""
        all_offers = self.get(key)
        if not all_offers:
            return None
        
        if not isinstance(all_offers, list):
            return None
        
        total = len(all_offers)
        total_pages = (total + page_size - 1) // page_size
        
        start = (page - 1) * page_size
        end = start + page_size
        page_offers = all_offers[start:end]
        
        return {
            "offers": page_offers,
            "page": page,
            "page_size": page_size,
            "total_offers": total,
            "total_pages": total_pages,
            "has_more": page < total_pages
        }
    
    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        return self.get(key) is not None
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def _cleanup_expired(self) -> int:
        """Remove expired entries. Returns count of removed items."""
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if now > v.expires_at]
        for k in expired_keys:
            del self._cache[k]
        return len(expired_keys)
    
    def stats(self) -> Dict:
        """Get cache statistics."""
        self._cleanup_expired()
        return {
            "entries": len(self._cache),
            "keys": list(self._cache.keys())
        }


# Global cache instance
flight_cache = FlightCache()
