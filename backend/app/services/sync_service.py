import uuid

from sqlalchemy.orm import Session

from app.models.sync import SyncQueue
from app.models.token import Token
# SECURITY: fraud detection logging for duplicate token redemption
from app.models.risk import RiskLog
from datetime import datetime, timezone
from app.utils.crypto import verify_token
from app.utils.hashing import hash_token

def enqueue_token_for_sync(
    db: Session,
    token_id: str,
    user_id: str,
) -> SyncQueue:
    entry = SyncQueue(
        token_id=uuid.UUID(token_id),
        user_id=uuid.UUID(user_id),
        status="pending",
    )
    db.add(entry)
    db.flush()
    db.refresh(entry)
    return entry

def process_sync_token(db: Session, token_id: str) -> bool:

    token = db.query(Token).filter(Token.id == uuid.UUID(token_id)).first()

    # SECURITY: token must exist
    if token is None:
        return False

    # SECURITY: reject expired tokens
    if token.expires_at < datetime.now(timezone.utc):
        token.status = "expired"
        db.flush()
        return False

    # SECURITY: verify payload integrity
    computed_hash = hash_token(token.payload)
    if computed_hash != token.hash:
        token.status = "tampered"
        db.flush()
        return False

    # SECURITY: verify issuer signature
    if not verify_token(token.payload, token.signature):
        token.status = "invalid_signature"
        db.flush()
        return False

    # SECURITY: token must be transferable
    if token.status not in ["locked", "active"]:
        return False

    # SECURITY: enforce first-sync-wins settlement
    if token.sync_status == "synced":

        fraud = RiskLog(
            user_id=None,
            transaction_id=None,
            risk_score=1.0,
            decision="duplicate_token_sync"
        )

        db.add(fraud)

        token.status = "fraud"

        db.flush()

        return False

    # SECURITY: accept first valid redemption
    if token.sync_status == "pending":

        token.sync_status = "synced"

        token.status = "spent"

        token.spent_at = datetime.now(timezone.utc)

        db.flush()

        return True

    return False