import uuid

from sqlalchemy.orm import Session

from app.models.sync import SyncQueue
from app.models.token import Token
from app.models.wallet import Wallet
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

def get_user_queue(db: Session, user_id: str):
    items = db.query(SyncQueue, Token).join(Token, SyncQueue.token_id == Token.id).filter(
        SyncQueue.user_id == uuid.UUID(user_id),
        SyncQueue.status == "pending"
    ).all()
    
    result = []
    for queue_item, token in items:
        # Calculate spent amount (or entire token value if not partially spent)
        spent = float(token.token_value - token.remaining_value) if token.remaining_value < token.token_value else float(token.token_value)
        result.append({
            "id": str(queue_item.id),
            "token_id": str(token.id),
            "amount": spent,
            "merchant": "Offline Transfer", 
            "status": queue_item.status,
            "created_at": queue_item.created_at
        })
    return result

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

        # Look up the wallet owner for fraud logging
        wallet = db.query(Wallet).filter(Wallet.id == token.wallet_id).first()
        owner_id = wallet.user_id if wallet else None

        fraud = RiskLog(
            user_id=owner_id,
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