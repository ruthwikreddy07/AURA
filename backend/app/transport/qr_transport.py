# app/transport/qr_transport.py

import json
import base64

# SECURITY: encode encrypted packet into QR-safe format
def encode_qr_packet(packet: dict) -> str:
    """
    Encodes packet into QR-safe base64 string
    """
    raw = json.dumps(packet).encode()
    return base64.urlsafe_b64encode(raw).decode()


def decode_qr_packet(qr_string: str) -> dict:
    """
    Decodes QR payload back to packet
    """
    raw = base64.urlsafe_b64decode(qr_string.encode())
    return json.loads(raw.decode())