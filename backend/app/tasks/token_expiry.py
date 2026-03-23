"""
Token Expiry Auto-Refund Background Task

Runs periodically (hourly in production) to:
1. Find all tokens where expires_at < now() and status = 'active'
2. Set status = 'expired'
3. Credit remaining_value back to the wallet balance
4. Create an auto-refund transaction record
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.token import Token
from app.models.wallet import Wallet
from app.models.transaction import Transaction
from app.database import SessionLocal


def process_expired_tokens(db: Session | None = None) -> dict:
    """
    Finds and processes all expired active tokens.
    Returns a summary of the operation.
    """
    own_session = db is None
    if own_session:
        db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        # Find all expired active tokens
        expired_tokens = (
            db.query(Token)
            .filter(Token.status == "active", Token.expires_at < now)
            .all()
        )

        refunded_count = 0
        total_refunded = Decimal("0.00")

        for token in expired_tokens:
            remaining = Decimal(str(token.remaining_value or 0))

            # 1. Mark token as expired
            token.status = "expired"
            token.spent_at = now

            # 2. Refund remaining_value to wallet
            if remaining > 0:
                wallet = (
                    db.query(Wallet)
                    .filter(Wallet.id == token.wallet_id)
                    .first()
                )
                if wallet:
                    wallet.balance += remaining
                    total_refunded += remaining

                    # 3. Create auto-refund transaction record
                    refund_tx = Transaction(
                        sender_id=wallet.user_id,
                        receiver_id=wallet.user_id,
                        amount=float(remaining),
                        status="completed",
                        mode="system",
                        note=f"Auto-refund for expired token {str(token.id)[:8]}",
                    )
                    db.add(refund_tx)

            refunded_count += 1

        db.commit()

        return {
            "processed": refunded_count,
            "total_refunded": float(total_refunded),
            "timestamp": now.isoformat(),
        }

    except Exception as e:
        db.rollback()
        raise e
    finally:
        if own_session:
            db.close()
