# app/utils/payment_packet.py

import json
from datetime import datetime

from app.utils.packet_crypto import encrypt_payload


def build_payment_packet(session_id: str, session_key: str, token_payload: dict):
    """
    SECURITY: builds encrypted packet for device-to-device transfer
    """

    payload_bytes = json.dumps(token_payload).encode()

    encrypted = encrypt_payload(session_key, payload_bytes)

    return {
        "session_id": session_id,
        "nonce": encrypted["nonce"],
        "ciphertext": encrypted["ciphertext"],
        "timestamp": datetime.utcnow().isoformat(),
    }