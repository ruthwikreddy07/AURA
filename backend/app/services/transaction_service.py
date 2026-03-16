import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session, aliased

from app.ai.risk_engine import evaluate_transaction
from app.models.risk import RiskLog
from app.models.token import Token
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.crypto import verify_token
from app.utils.hashing import hash_token, hash_transaction


def create_transaction(
    db: Session,
    sender_id: str,
    receiver_id: str,
    token_id: str,
    mode: str,
    risk_score: float,
) -> Transaction:
    now = datetime.now(timezone.utc)

    token = db.query(Token).filter(Token.id == uuid.UUID(token_id)).first()
    if token is None:
        raise ValueError("Token not found")

    if token.status != "active":
        raise ValueError("Token already spent or inactive")

    # Reconstruct the payload that was originally signed and hashed.
    # Token model stores: wallet_id, token_value, nonce, expires_at — same
    # fields that token_generator.build_token_payload() serialised.
    token_payload = {
        "wallet_id": str(token.wallet_id),
        "token_value": float(token.token_value),
        "nonce": token.nonce,
        "expires_at": token.expires_at.isoformat(),
    }

    computed_hash = hash_token(token_payload)
    if computed_hash != token.hash:
        raise ValueError("Token hash mismatch")

    if not verify_token(token_payload, token.signature):
        raise ValueError("Invalid token signature")

    existing_txn = (
        db.query(Transaction)
        .filter(Transaction.token_id == uuid.UUID(token_id))
        .first()
    )
    if existing_txn:
        risk = RiskLog(
            user_id=uuid.UUID(sender_id),
            transaction_id=None,
            risk_score=1.0,
            decision="double_spend_detected",
        )
        db.add(risk)
        db.flush()
        raise ValueError("Token already used in another transaction")

    token.status = "locked"
    db.flush()

    amount = float(token.token_value)
    risk_result = evaluate_transaction(amount=amount, mode=mode, timestamp=now)
    risk_score = risk_result["risk_score"]
    decision = risk_result["decision"]

    if decision == "block":
        risk = RiskLog(
            user_id=uuid.UUID(sender_id),
            transaction_id=None,
            risk_score=risk_score,
            decision="blocked_by_risk_engine",
        )
        db.add(risk)
        db.flush()
        raise ValueError("Transaction blocked by risk engine")

    payload = {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "token_id": token_id,
        "mode": mode,
        "risk_score": risk_score,
        "created_at": now.isoformat(),
    }
    txn_hash = hash_transaction(payload)

    transaction = Transaction(
        sender_id=uuid.UUID(sender_id),
        receiver_id=uuid.UUID(receiver_id),
        token_id=uuid.UUID(token_id),
        mode=mode,
        risk_score=risk_score,
        status="initiated",
        txn_hash=txn_hash,
    )
    db.add(transaction)
    db.flush()
    db.refresh(transaction)

    risk_log = RiskLog(
        user_id=uuid.UUID(sender_id),
        transaction_id=transaction.id,
        risk_score=risk_score,
        decision=decision,
    )
    db.add(risk_log)
    db.flush()

    return transaction


def get_user_transactions(
    db: Session,
    user_id: str,
) -> list[dict]:
    uid = uuid.UUID(user_id)

    Sender = aliased(User)
    Receiver = aliased(User)

    results = (
        db.query(Transaction, Token, Sender.full_name, Receiver.full_name)
        .join(Token, Transaction.token_id == Token.id)
        .outerjoin(Sender, Transaction.sender_id == Sender.id)
        .outerjoin(Receiver, Transaction.receiver_id == Receiver.id)
        .filter(
            (Transaction.sender_id == uid) | (Transaction.receiver_id == uid)
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    transactions = []
    for txn, token, sender_name, receiver_name in results:
        transactions.append({
            "id": str(txn.id),
            "sender_id": str(txn.sender_id),
            "receiver_id": str(txn.receiver_id),
            "sender_name": sender_name or "Unknown",
            "receiver_name": receiver_name or "Unknown",
            "token_id": str(txn.token_id),
            "amount": float(token.token_value),
            "mode": txn.mode,
            "risk_score": txn.risk_score,
            "status": txn.status,
            "txn_hash": txn.txn_hash,
            "created_at": txn.created_at,
        })

    return transactions