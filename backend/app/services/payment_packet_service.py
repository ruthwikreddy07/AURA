# app/services/payment_packet_service.py

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.transport.transport_manager import encode_packet, decode_packet
from app.ai.risk_engine import evaluate_transaction

from app.models.token import Token
from app.models.transaction import Transaction


# SECURITY: build payment packet for offline transfer
def build_payment_packet(
    session_id: str,
    token_id: str,
    sender_id: str,
) -> dict:

    return {
        "session_id": session_id,
        "token_id": token_id,
        "sender_id": sender_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# SECURITY: encode packet for selected transport mode
def encode_payment_packet(packet: dict, mode: str):

    return encode_packet(packet, mode)


# SECURITY: decode packet received from transport
def decode_payment_packet(data, mode: str):

    return decode_packet(data, mode)


# SECURITY: verify packet + process transaction
def process_received_packet(
    db: Session,
    packet: dict,
    receiver_id: str,
    mode: str,
):

    token_id = uuid.UUID(packet["token_id"])
    sender_id = uuid.UUID(packet["sender_id"])

    token = (
        db.query(Token)
        .filter(Token.id == token_id)
        .first()
    )

    if not token:
        raise ValueError("Token not found")

    if token.status != "active":
        raise ValueError("Token already spent")

    amount = float(token.token_value)

    risk = evaluate_transaction(
        amount=amount,
        mode=mode,
        timestamp=datetime.now(timezone.utc),
    )

    txn = Transaction(
        sender_id=sender_id,
        receiver_id=uuid.UUID(receiver_id),
        token_id=token_id,
        mode=mode,
        risk_score=risk["risk_score"],
        status="completed",
        txn_hash=str(uuid.uuid4()),
    )

    token.status = "spent"

    db.add(txn)
    db.flush()
    db.refresh(txn)

    return txn