from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import mode_service

router = APIRouter()


class SetModePreferencesRequest(BaseModel):
    user_id: str
    ble_enabled: bool
    qr_enabled: bool
    sound_enabled: bool
    light_enabled: bool
    nfc_enabled: bool
    manual_override: bool


class ModePreferencesResponse(BaseModel):
    id: str
    user_id: str
    ble_enabled: bool
    qr_enabled: bool
    sound_enabled: bool
    light_enabled: bool
    nfc_enabled: bool
    manual_override: bool

    model_config = {"from_attributes": True}


@router.post("/set", response_model=ModePreferencesResponse, status_code=status.HTTP_200_OK)
def set_mode_preferences(payload: SetModePreferencesRequest, db: Session = Depends(get_db)):
    try:
        prefs = mode_service.set_user_mode_preferences(
            db=db,
            user_id=payload.user_id,
            ble_enabled=payload.ble_enabled,
            qr_enabled=payload.qr_enabled,
            sound_enabled=payload.sound_enabled,
            light_enabled=payload.light_enabled,
            nfc_enabled=payload.nfc_enabled,
            manual_override=payload.manual_override,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return ModePreferencesResponse(
        id=str(prefs.id),
        user_id=str(prefs.user_id),
        ble_enabled=prefs.ble_enabled,
        qr_enabled=prefs.qr_enabled,
        sound_enabled=prefs.sound_enabled,
        light_enabled=prefs.light_enabled,
        nfc_enabled=prefs.nfc_enabled,
        manual_override=prefs.manual_override,
    )


@router.get("/user/{user_id}", response_model=ModePreferencesResponse)
def get_mode_preferences(user_id: str, db: Session = Depends(get_db)):
    try:
        prefs = mode_service.get_user_mode_preferences(db=db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if prefs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No mode preferences found for user '{user_id}'",
        )
    return ModePreferencesResponse(
        id=str(prefs.id),
        user_id=str(prefs.user_id),
        ble_enabled=prefs.ble_enabled,
        qr_enabled=prefs.qr_enabled,
        sound_enabled=prefs.sound_enabled,
        light_enabled=prefs.light_enabled,
        nfc_enabled=prefs.nfc_enabled,
        manual_override=prefs.manual_override,
    )

class ModeSelectionRequest(BaseModel):
    ble_available: bool
    mic_available: bool
    camera_available: bool
    noise_level: float
    light_level: float


class ModeSelectionResponse(BaseModel):
    recommended_mode: str
    available_modes: list[str]
    scores: dict


@router.post("/select", response_model=ModeSelectionResponse)
def select_mode(payload: ModeSelectionRequest):

    result = mode_service.select_best_mode(
        ble_available=payload.ble_available,
        mic_available=payload.mic_available,
        camera_available=payload.camera_available,
        noise_level=payload.noise_level,
        light_level=payload.light_level,
    )

    return result