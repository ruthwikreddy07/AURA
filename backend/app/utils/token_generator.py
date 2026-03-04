import secrets

from app.utils.crypto import sign_token
from app.utils.hashing import hash_token


def generate_nonce() -> int:
    return secrets.randbits(63)


def build_token_payload(
    wallet_id: str,
    token_value: float,
    nonce: int,
    expires_at: str,
) -> dict:
    return {
        "wallet_id": wallet_id,
        "token_value": token_value,
        "nonce": nonce,
        "expires_at": expires_at,
    }


def generate_signed_token(
    wallet_id: str,
    token_value: float,
    expires_at: str,
) -> dict:
    nonce = generate_nonce()
    payload = build_token_payload(
        wallet_id=wallet_id,
        token_value=token_value,
        nonce=nonce,
        expires_at=expires_at,
    )
    token_hash = hash_token(payload)
    signature = sign_token(payload)
    return {
        "payload": payload,
        "hash": token_hash,
        "signature": signature,
    }