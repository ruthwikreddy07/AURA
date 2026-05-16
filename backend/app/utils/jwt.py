"""
JWT token creation and verification using PyJWT.
"""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.JWT_EXPIRY_MINUTES),
    }
    
    if settings.JWT_ALGORITHM.startswith("RS"):
        private_key = settings.TOKEN_PRIVATE_KEY_PATH.read_text()
        return jwt.encode(payload, private_key, algorithm=settings.JWT_ALGORITHM)
    
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a signed JWT refresh token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=7), # Refresh token lives for 7 days
    }
    
    if settings.JWT_ALGORITHM.startswith("RS"):
        private_key = settings.TOKEN_PRIVATE_KEY_PATH.read_text()
        return jwt.encode(payload, private_key, algorithm=settings.JWT_ALGORITHM)
    
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises jwt.PyJWTError on failure."""
    if settings.JWT_ALGORITHM.startswith("RS"):
        public_key = settings.TOKEN_PUBLIC_KEY_PATH.read_text()
        return jwt.decode(token, public_key, algorithms=[settings.JWT_ALGORITHM])
        
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

def decode_refresh_token(token: str) -> dict:
    """Decode and validate a JWT refresh token."""
    if settings.JWT_ALGORITHM.startswith("RS"):
        public_key = settings.TOKEN_PUBLIC_KEY_PATH.read_text()
        payload = jwt.decode(token, public_key, algorithms=[settings.JWT_ALGORITHM])
    else:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid token type")
        
    return payload
