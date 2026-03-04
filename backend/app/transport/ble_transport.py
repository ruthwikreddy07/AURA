# app/transport/ble_transport.py

import json

# SECURITY: BLE packet transport for encrypted payment packets
def encode_ble_packet(packet: dict) -> bytes:
    """
    Converts packet to BLE-compatible byte payload
    """
    return json.dumps(packet).encode("utf-8")


def decode_ble_packet(data: bytes) -> dict:
    """
    Converts received BLE data back to packet
    """
    return json.loads(data.decode("utf-8"))