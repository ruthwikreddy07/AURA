import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from app.ai.risk_engine import evaluate_transaction
from app.models.transaction import Transaction
from app.utils.hashing import hash_transaction
from app.models.token import Token
from app.utils.crypto import verify_token
from app.utils.hashing import hash_token
from app.models.risk import RiskLog

def create_transaction(
    db: Session,
    sender_id: str,
    receiver_id: str,
    token_id: str,
    mode: str,
    risk_score: float,
) -> Transaction:


    now = datetime.now(timezone.utc)
    # fetch token
    token = db.query(Token).filter(Token.id == uuid.UUID(token_id)).first()

    if token is None:
        raise ValueError("Token not found")

    # check status
    if token.status != "active":
        raise ValueError("Token already spent or inactive")

    # verify hash integrity
    computed_hash = hash_token(token.payload)
    if computed_hash != token.hash:
        raise ValueError("Token hash mismatch")

    # verify cryptographic signature
    if not verify_token(token.payload, token.signature):
        raise ValueError("Invalid token signature")
    # 🔴 STEP 2 — REPLAY DETECTION
    existing_txn = (
        db.query(Transaction)
        .filter(Transaction.token_id == uuid.UUID(token_id))
        .first()
    )

    if existing_txn:
        # log fraud attempt
        risk = RiskLog(
            user_id=uuid.UUID(sender_id),
            transaction_id=None,
            risk_score=1.0,
            decision="double_spend_detected"
        )

        db.add(risk)
        db.flush()

        raise ValueError("Token already used in another transaction")
    # lock token immediately to prevent replay
    # 🔴 LOCK TOKEN AFTER VALIDATION
    token.status = "locked"
    db.flush()
    amount = float(token.token_value)

    risk_result = evaluate_transaction(
        amount=amount,
        mode=mode,
        timestamp=now,
    )

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
):
    uid = uuid.UUID(user_id)

    results = (
        db.query(Transaction, Token)
        .join(Token, Transaction.token_id == Token.id)
        .filter(
            (Transaction.sender_id == uid) | (Transaction.receiver_id == uid)
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    transactions = []

    for txn, token in results:
        transactions.append({
            "id": str(txn.id),
            "sender_id": str(txn.sender_id),
            "receiver_id": str(txn.receiver_id),
            "token_id": str(txn.token_id),
            "amount": float(token.token_value),  # ✅ amount comes from token
            "mode": txn.mode,
            "status": txn.status,
            "created_at": txn.created_at,
        })

    return transactions