import uuid

from sqlalchemy.orm import Session
from app.ai.mode_scoring_engine import score_modes
from app.models.user_mode_preferences import UserModePreferences

def set_user_mode_preferences(
    db: Session,
    user_id: str,
    ble_enabled: bool,
    qr_enabled: bool,
    sound_enabled: bool,
    light_enabled: bool,
    nfc_enabled: bool,
    manual_override: bool,
) -> UserModePreferences:
    uid = uuid.UUID(user_id)
    prefs = (
        db.query(UserModePreferences)
        .filter(UserModePreferences.user_id == uid)
        .first()
    )
    if prefs is None:
        prefs = UserModePreferences(user_id=uid)
        db.add(prefs)

    prefs.ble_enabled = ble_enabled
    prefs.qr_enabled = qr_enabled
    prefs.sound_enabled = sound_enabled
    prefs.light_enabled = light_enabled
    prefs.nfc_enabled = nfc_enabled
    prefs.manual_override = manual_override

    db.flush()
    db.refresh(prefs)
    return prefs


def get_user_mode_preferences(
    db: Session,
    user_id: str,
) -> UserModePreferences | None:
    return (
        db.query(UserModePreferences)
        .filter(UserModePreferences.user_id == uuid.UUID(user_id))
        .first()
    )
# SECURITY: environment-aware mode selection prevents unreliable channels
def select_best_mode(
    ble_available: bool,
    mic_available: bool,
    camera_available: bool,
    noise_level: float,
    light_level: float,
):
    """
    SECURITY: adaptive environment scoring engine
    """

    result = score_modes(
        ble_available=ble_available,
        mic_available=mic_available,
        camera_available=camera_available,
        noise_level=noise_level,
        light_level=light_level,
    )

    return result