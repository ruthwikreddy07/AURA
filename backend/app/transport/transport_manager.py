# app/transport/transport_manager.py

from app.transport.ble_transport import encode_ble_packet, decode_ble_packet
from app.transport.qr_transport import encode_qr_packet, decode_qr_packet
from app.transport.sound_transport import encode_sound_packet, decode_sound_packet
from app.transport.light_transport import encode_light_packet, decode_light_packet


# SECURITY: unified packet routing for all communication modes
def encode_packet(packet: dict, mode: str):

    if mode == "ble":
        return encode_ble_packet(packet)

    elif mode == "qr":
        return encode_qr_packet(packet)

    elif mode == "sound":
        return encode_sound_packet(packet)

    elif mode == "light":
        return encode_light_packet(packet)

    else:
        raise ValueError("Unsupported transport mode")


def decode_packet(data, mode: str):

    if mode == "ble":
        return decode_ble_packet(data)

    elif mode == "qr":
        return decode_qr_packet(data)

    elif mode == "sound":
        return decode_sound_packet(data)

    elif mode == "light":
        return decode_light_packet(data)

    else:
        raise ValueError("Unsupported transport mode")