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
    is_expired: bool = False


class FlightCache:
    """
    In-memory cache for flight results.
    Entries have a 5-minute active TTL.
    After expiration, data is removed but 'expired' status is kept for UI.
    Hard cleanup happens after 30 minutes.
    """
    
    def __init__(self, default_ttl_seconds: int = 300):  # 5 minutes active TTL
        self._cache: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl_seconds
        self.tombstone_ttl = 1800  # 30 minutes until full removal
    
    def set(self, key: str, data: Any, ttl_seconds: Optional[int] = None) -> None:
        """Store data with active TTL."""
        ttl = ttl_seconds or self.default_ttl
        now = time.time()
        self._cache[key] = CacheEntry(
            data=data,
            expires_at=now + ttl,
            created_at=now
        )
        self._cleanup_tombstones()
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get data if exists.
        Returns None if key missing.
        Returns dict {"status": "expired"} if expired.
        Returns actual data list if active.
        """
        entry = self._cache.get(key)
        if not entry:
            return None
        
        now = time.time()
        
        # Check if active TTL passed
        if now > entry.expires_at:
            # Mark as expired if not already done
            if not entry.is_expired:
                entry.is_expired = True
                entry.data = None  # Clear data to save memory
            return {"status": "expired"}
            
        return entry.data
    
    def get_page(self, key: str, page: int, page_size: int = 10) -> Optional[Dict]:
        """Get a specific page of cached results, or expiration status."""
        result = self.get(key)
        if not result:
            return None
            
        # Check for expired status wrapper
        if isinstance(result, dict) and result.get("status") == "expired":
            return {"status": "expired"}
        
        # Assumption: result is the list of offers
        all_offers = result
        if not isinstance(all_offers, list):
            return None
        
        total = len(all_offers)
        total_pages = (total + page_size - 1) // page_size
        
        start = (page - 1) * page_size
        end = start + page_size
        page_offers = all_offers[start:end]
        
        return {
            "status": "active",
            "offers": page_offers,
            "page": page,
            "page_size": page_size,
            "total_offers": total,
            "total_pages": total_pages,
            "has_more": page < total_pages
        }
    
    def exists(self, key: str) -> bool:
        """Check if key exists (active or expired)."""
        return key in self._cache
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache completely."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def _cleanup_tombstones(self) -> int:
        """Remove entries older than tombstone_ttl (30 mins)."""
        now = time.time()
        # Hard limit: created_at + 30 mins
        expired_keys = [
            k for k, v in self._cache.items() 
            if now > (v.created_at + self.tombstone_ttl)
        ]
        for k in expired_keys:
            del self._cache[k]
        return len(expired_keys)
    
    def stats(self) -> Dict:
        """Get cache statistics."""
        self._cleanup_tombstones()
        active = sum(1 for v in self._cache.values() if not v.is_expired and time.time() < v.expires_at)
        expired = len(self._cache) - active
        return {
            "entries": len(self._cache),
            "active": active,
            "expired": expired,
            "keys": list(self._cache.keys())
        }


# Global cache instance
flight_cache = FlightCache()
