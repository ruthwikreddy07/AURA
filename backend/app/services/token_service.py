import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.token import Token
from app.utils.token_generator import generate_signed_token


def issue_token(
    db: Session,
    wallet_id: str,
    token_value: float,
    expires_at: datetime,
) -> Token:
    if expires_at <= datetime.now(timezone.utc):
        raise ValueError("Token expiration must be in the future")

    # Find offline wallet
    from app.models.wallet import Wallet
    offline_wallet = db.query(Wallet).filter(Wallet.id == uuid.UUID(wallet_id)).first()
    if not offline_wallet:
        raise ValueError("Offline wallet not found")

    # Find online wallet for the same user
    online_wallet = db.query(Wallet).filter(
        Wallet.user_id == offline_wallet.user_id,
        Wallet.wallet_type == "online"
    ).first()
    if not online_wallet:
        raise ValueError("Online wallet not found")

    # Check balance
    dec_value = Decimal(str(token_value))
    if online_wallet.balance < dec_value:
        raise ValueError("Insufficient online balance to issue token")

    # Deduct and credit
    online_wallet.balance -= dec_value
    offline_wallet.balance += dec_value

    signed = generate_signed_token(
        wallet_id=wallet_id,
        token_value=token_value,
        expires_at=expires_at.isoformat(),
    )

    token = Token(
        wallet_id=uuid.UUID(wallet_id),
        token_value=token_value,
        remaining_value=token_value,
        status="active",
        expires_at=expires_at,
        sync_status="pending",
        nonce=signed["payload"]["nonce"],
        payload=signed["payload"],   # NEW LINE
        signature=signed["signature"],
        hash=signed["hash"],
    )
    db.add(token)
    db.flush()
    db.refresh(token)
    return token


def get_wallet_tokens(
    db: Session,
    wallet_id: str,
) -> list[Token]:
    return (
        db.query(Token)
        .filter(Token.wallet_id == uuid.UUID(wallet_id))
        .all()
    )


def mark_token_spent(
    db: Session,
    token_id: str,
) -> Token:
    token = db.query(Token).filter(Token.id == uuid.UUID(token_id)).first()
    if token is None:
        raise ValueError(f"Token '{token_id}' not found")
    token.status = "spent"
    token.remaining_value = 0
    token.spent_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(token)
    return token

def spend_partial_token(
    db: Session,
    token_id: str,
    amount_spent: float,
) -> Token:
    token = db.query(Token).filter(Token.id == uuid.UUID(token_id)).first()
    if token is None:
        raise ValueError(f"Token '{token_id}' not found")
        
    dec_amount = Decimal(str(amount_spent))
    if token.remaining_value < dec_amount:
        raise ValueError("Insufficient token balance")
        
    token.remaining_value -= dec_amount
    if token.remaining_value == 0:
        token.status = "spent"
        token.spent_at = datetime.now(timezone.utc)
        
    db.flush()
    db.refresh(token)
    return token