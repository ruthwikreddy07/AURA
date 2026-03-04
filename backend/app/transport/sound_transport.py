# app/transport/sound_transport.py

import json
import base64

# SECURITY: encode packet into sound-safe string
def encode_sound_packet(packet: dict) -> str:
    """
    Converts packet into base64 string for ultrasonic transmission
    """
    raw = json.dumps(packet).encode()
    return base64.b64encode(raw).decode()


def decode_sound_packet(data: str) -> dict:
    """
    Decode ultrasonic packet
    """
    raw = base64.b64decode(data.encode())
    return json.loads(raw.decode())