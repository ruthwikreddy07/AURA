"""
Redis-backed OTP store. Falls back to in-memory dict if Redis is unavailable.
"""
import os
import json
from datetime import datetime, timezone

_redis_client = None
_redis_available = None  # None = untested, True = connected, False = failed
_memory_fallback = {}


def _get_redis():
    global _redis_client, _redis_available
    if _redis_available is False:
        return None
    if _redis_client is not None:
        return _redis_client
        
    try:
        import redis
        url = os.getenv("REDIS_URL", "redis://localhost:6379")
        # Set a short socket timeout to prevent long hangs if Redis is unreachable
        _redis_client = redis.from_url(url, decode_responses=True, socket_timeout=1.0)
        _redis_client.ping()
        _redis_available = True
        print("[OTP Store] Connected to Redis")
        return _redis_client
    except Exception as e:
        _redis_available = False
        print(f"[OTP Store] Redis unavailable ({e}), using in-memory fallback")
        return None


def store_otp(phone_number: str, otp: str, ttl_seconds: int = 300):
    """Store OTP with a TTL (default 5 minutes)."""
    r = _get_redis()
    if r:
        key = f"otp:{phone_number}"
        data = json.dumps({"otp": otp, "expires_at": (datetime.now(timezone.utc).timestamp() + ttl_seconds)})
        r.setex(key, ttl_seconds, data)
    else:
        from datetime import timedelta
        _memory_fallback[phone_number] = {
            "otp": otp,
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
        }


def get_otp(phone_number: str) -> dict | None:
    """Retrieve stored OTP data. Returns None if not found or expired."""
    r = _get_redis()
    if r:
        key = f"otp:{phone_number}"
        raw = r.get(key)
        if not raw:
            return None
        data = json.loads(raw)
        # Convert timestamp back to datetime for consistent API
        data["expires_at"] = datetime.fromtimestamp(data["expires_at"], tz=timezone.utc)
        return data
    else:
        stored = _memory_fallback.get(phone_number)
        if not stored:
            return None
        if datetime.now(timezone.utc) > stored["expires_at"]:
            del _memory_fallback[phone_number]
            return None
        return stored


def delete_otp(phone_number: str):
    """Remove OTP after verification (consume it)."""
    r = _get_redis()
    if r:
        r.delete(f"otp:{phone_number}")
    else:
        _memory_fallback.pop(phone_number, None)


def store_verified_phone(phone_number: str, ttl_seconds: int = 900):
    """Mark a phone number as verified so they can complete profile registration."""
    r = _get_redis()
    if r:
        r.setex(f"verified:{phone_number}", ttl_seconds, "1")
    else:
        from datetime import timedelta
        _memory_fallback[f"verified:{phone_number}"] = {
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
        }

def get_verified_phone(phone_number: str) -> bool:
    r = _get_redis()
    if r:
        return r.get(f"verified:{phone_number}") is not None
    else:
        stored = _memory_fallback.get(f"verified:{phone_number}")
        if not stored:
            return False
        if datetime.now(timezone.utc) > stored["expires_at"]:
            del _memory_fallback[f"verified:{phone_number}"]
            return False
        return True

def delete_verified_phone(phone_number: str):
    r = _get_redis()
    if r:
        r.delete(f"verified:{phone_number}")
    else:
        _memory_fallback.pop(f"verified:{phone_number}", None)



def cleanup_expired():
    """Clean expired OTPs from in-memory store (no-op for Redis since TTL handles it)."""
    r = _get_redis()
    if r:
        return  # Redis TTL auto-expires
    now = datetime.now(timezone.utc)
    expired = [k for k, v in _memory_fallback.items() if v["expires_at"] < now]
    for k in expired:
        del _memory_fallback[k]
