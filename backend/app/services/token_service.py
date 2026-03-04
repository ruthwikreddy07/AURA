import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.token import Token
from app.utils.token_generator import generate_signed_token

from app.models.risk import RiskLog
def issue_token(
    db: Session,
    wallet_id: str,
    token_value: float,
    expires_at: datetime,
) -> Token:
    if expires_at <= datetime.now(timezone.utc):
        raise ValueError("Token expiration must be in the future")
    signed = generate_signed_token(
        wallet_id=wallet_id,
        token_value=token_value,
        expires_at=expires_at.isoformat(),
    )

    token = Token(
    wallet_id=uuid.UUID(wallet_id),
    token_value=token_value,
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
    token.spent_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(token)
    return token