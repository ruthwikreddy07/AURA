# app/transport/light_transport.py

import json
import base64
import zlib

# SECURITY: compress packet for optical transmission
def encode_light_packet(packet: dict) -> str:
    """
    Compress + encode packet for flash/light pulses
    """
    raw = json.dumps(packet).encode()
    compressed = zlib.compress(raw)
    return base64.b64encode(compressed).decode()


def decode_light_packet(data: str) -> dict:
    """
    Decode optical packet
    """
    compressed = base64.b64decode(data.encode())
    raw = zlib.decompress(compressed)
    return json.loads(raw.decode())