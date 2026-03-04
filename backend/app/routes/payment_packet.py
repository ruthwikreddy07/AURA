# app/routes/payment_packet.py

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
# SECURITY: prevent replay using expired sessions
from datetime import datetime, timezone
from app.database import get_db
from app.services import payment_session_service, transaction_service
from app.utils.packet_crypto import decrypt_payload

router = APIRouter()


class PaymentPacketRequest(BaseModel):
    session_id: str
    nonce: str
    ciphertext: str


@router.post("/submit")
def submit_payment_packet(payload: PaymentPacketRequest, db: Session = Depends(get_db)):
    """
    SECURITY: decrypt packet and create transaction
    """

    session = payment_session_service.get_session(db, payload.session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "initiated":
        raise HTTPException(status_code=400, detail="Session already used or closed")
    if datetime.now(timezone.utc) > session.expires_at:
        raise HTTPException(status_code=400, detail="Session expired")
    if not session.motion_verified:
        raise HTTPException(status_code=400, detail="Motion verification required")

    decrypted = decrypt_payload(
        session.session_key,
        payload.nonce,
        payload.ciphertext,
    )

    data = json.loads(decrypted)

    txn = transaction_service.create_transaction(
        db=db,
        sender_id=data["sender_id"],
        receiver_id=data["receiver_id"],
        token_id=data["token_id"],
        mode=session.mode,
        risk_score=data.get("risk_score", 0.1),
    )
    session.status = "completed"
    db.flush()

    return {
        "transaction_id": str(txn.id),
        "status": "accepted",
    }