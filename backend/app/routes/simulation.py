# app/routes/simulation.py

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db

from app.services import (
    payment_session_service,
    transaction_service,
    sync_service,
)

from app.utils.packet_crypto import encrypt_payload
from app.models.token import Token

router = APIRouter()


class SimulationRequest(BaseModel):
    sender_id: str
    receiver_id: str
    token_id: str
    mode: str = "ble"


@router.post("/offline-payment")
def simulate_offline_payment(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Simulates the full offline payment protocol:

    sender → create session
    receiver → motion verification
    sender → encrypt packet
    receiver → decrypt packet
    receiver → create transaction
    settlement → queue sync
    """

    # -------------------------
    # STEP 1 — CREATE SESSION
    # -------------------------

    session = payment_session_service.create_payment_session(
        db=db,
        sender_id=payload.sender_id,
        receiver_id=payload.receiver_id,
        mode=payload.mode,
    )

    # -------------------------
    # STEP 2 — SIMULATE MOTION VERIFICATION
    # -------------------------

    session.sender_motion_hash = "simulated-motion"
    session.receiver_motion_hash = "simulated-motion"
    session.motion_verified = True

    db.flush()

    # -------------------------
    # STEP 3 — LOAD TOKEN
    # -------------------------

    token = db.query(Token).filter(Token.id == payload.token_id).first()

    if token is None:
        raise HTTPException(status_code=404, detail="Token not found")

    # -------------------------
    # STEP 4 — BUILD PAYMENT PAYLOAD
    # -------------------------

    packet_data = {
        "sender_id": payload.sender_id,
        "receiver_id": payload.receiver_id,
        "token_id": payload.token_id,
        "risk_score": 0.1,
    }

    payload_bytes = json.dumps(packet_data).encode()

    encrypted = encrypt_payload(session.session_key, payload_bytes)

    # -------------------------
    # STEP 5 — DECRYPT (SIMULATED DEVICE RECEIVE)
    # -------------------------

    decrypted = json.loads(payload_bytes.decode())

    # -------------------------
    # STEP 6 — CREATE TRANSACTION
    # -------------------------

    txn = transaction_service.create_transaction(
        db=db,
        sender_id=decrypted["sender_id"],
        receiver_id=decrypted["receiver_id"],
        token_id=decrypted["token_id"],
        mode=session.mode,
        risk_score=decrypted["risk_score"],
    )

    # close session
    session.status = "completed"
    db.flush()

    # -------------------------
    # STEP 7 — QUEUE SYNC
    # -------------------------

    sync_entry = sync_service.enqueue_token_for_sync(
        db=db,
        token_id=payload.token_id,
        user_id=payload.receiver_id,
    )

    return {
        "simulation": "success",
        "session_id": str(session.id),
        "transaction_id": str(txn.id),
        "sync_queue_id": str(sync_entry.id),
        "mode": payload.mode,
        "timestamp": datetime.now(timezone.utc),
    }