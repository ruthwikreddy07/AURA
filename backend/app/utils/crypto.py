import base64
import json

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey

from app.config import settings


def load_private_key() -> RSAPrivateKey:
    with open(settings.TOKEN_PRIVATE_KEY_PATH, "rb") as f:
        key = serialization.load_pem_private_key(f.read(), password=None)
    if not isinstance(key, RSAPrivateKey):
        raise TypeError("Private key is not an RSA key")
    return key


def load_public_key() -> RSAPublicKey:
    with open(settings.TOKEN_PUBLIC_KEY_PATH, "rb") as f:
        key = serialization.load_pem_public_key(f.read())
    if not isinstance(key, RSAPublicKey):
        raise TypeError("Public key is not an RSA key")
    return key


def sign_token(data: dict) -> str:
    payload = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    private_key = load_private_key()
    signature = private_key.sign(
        payload,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode("utf-8")


def verify_token(data: dict, signature: str) -> bool:
    payload = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    public_key = load_public_key()
    try:
        public_key.verify(
            base64.b64decode(signature),
            payload,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False