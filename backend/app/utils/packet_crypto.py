# app/utils/packet_crypto.py

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_nonce() -> bytes:
    """
    SECURITY: unique nonce for AES-GCM encryption
    prevents packet replay attacks
    """
    return os.urandom(12)


def encrypt_payload(session_key: str, payload: bytes) -> dict:
    """
    SECURITY: encrypt payment payload using AES-GCM
    """
    key = bytes.fromhex(session_key)
    aes = AESGCM(key)

    nonce = generate_nonce()
    ciphertext = aes.encrypt(nonce, payload, None)

    return {
        "nonce": base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ciphertext).decode(),
    }


def decrypt_payload(session_key: str, nonce: str, ciphertext: str) -> bytes:
    """
    SECURITY: decrypt payment payload
    """
    key = bytes.fromhex(session_key)
    aes = AESGCM(key)

    nonce_bytes = base64.b64decode(nonce)
    ciphertext_bytes = base64.b64decode(ciphertext)

    return aes.decrypt(nonce_bytes, ciphertext_bytes, None)