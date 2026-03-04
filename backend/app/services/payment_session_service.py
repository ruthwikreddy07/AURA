import uuid

from sqlalchemy.orm import Session

from app.models.payment_session import PaymentSession
from app.utils.session_crypto import generate_session_key
from datetime import datetime, timedelta, timezone

# SECURITY: session key ensures encrypted token transfer between devices
def create_payment_session(
    db: Session,
    sender_id: str,
    receiver_id: str,
    mode: str,
) -> PaymentSession:
    expires = datetime.now(timezone.utc) + timedelta(minutes=2)
    session = PaymentSession(
    sender_id=uuid.UUID(sender_id),
    receiver_id=uuid.UUID(receiver_id),
    mode=mode,
    session_key=generate_session_key(),
    status="initiated",
    expires_at=expires,
    )

    db.add(session)
    db.flush()
    db.refresh(session)

    return session
def get_session(db: Session, session_id: str) -> PaymentSession | None:
    """
    SECURITY: fetch payment session used to decrypt packets
    """
    return (
        db.query(PaymentSession)
        .filter(PaymentSession.id == uuid.UUID(session_id))
        .first()
    )
def submit_motion_proof(
    db: Session,
    session_id: str,
    user_id: str,
    motion_hash: str,
) -> PaymentSession:

    session = (
        db.query(PaymentSession)
        .filter(PaymentSession.id == uuid.UUID(session_id))
        .first()
    )

    if not session:
        raise ValueError("Session not found")

    uid = uuid.UUID(user_id)

    # SECURITY: store motion proof from each participant
    if uid == session.sender_id:
        session.sender_motion_hash = motion_hash

    elif uid == session.receiver_id:
        session.receiver_motion_hash = motion_hash

    else:
        raise ValueError("User not part of session")

    # SECURITY: verify both devices produced same motion entropy
    if (
        session.sender_motion_hash
        and session.receiver_motion_hash
        and session.sender_motion_hash == session.receiver_motion_hash
    ):
        session.motion_verified = True

    db.flush()
    db.refresh(session)

    return session