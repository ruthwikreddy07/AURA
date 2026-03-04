from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import payment_session_service


router = APIRouter()

# SECURITY: session key used to encrypt token payload during device communication
class CreateSessionRequest(BaseModel):
    sender_id: str
    receiver_id: str
    mode: str


@router.post("/create")
def create_payment_session(payload: CreateSessionRequest, db: Session = Depends(get_db)):
    session = payment_session_service.create_payment_session(
        db=db,
        sender_id=payload.sender_id,
        receiver_id=payload.receiver_id,
        mode=payload.mode,
    )

    return {
        "session_id": str(session.id),
        "session_key": session.session_key,
        "mode": session.mode,
    }
class MotionProofRequest(BaseModel):
    session_id: str
    user_id: str
    motion_hash: str


@router.post("/motion-proof")
def submit_motion_proof(payload: MotionProofRequest, db: Session = Depends(get_db)):

    session = payment_session_service.submit_motion_proof(
        db=db,
        session_id=payload.session_id,
        user_id=payload.user_id,
        motion_hash=payload.motion_hash,
    )

    return {
        "session_id": str(session.id),
        "motion_verified": session.motion_verified,
    }