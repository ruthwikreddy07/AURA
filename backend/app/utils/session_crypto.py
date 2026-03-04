import secrets


def generate_session_key() -> str:
    """
    SECURITY: generates ephemeral session key
    used for encrypting token payload during transfer
    """
    return secrets.token_hex(32)