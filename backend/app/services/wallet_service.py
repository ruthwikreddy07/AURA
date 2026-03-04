import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.wallet import Wallet


def create_wallet(
    db: Session,
    user_id: str,
    wallet_type: str,
) -> Wallet:
    wallet = Wallet(
        user_id=uuid.UUID(user_id),
        wallet_type=wallet_type,
        balance=Decimal("0.00"),
    )
    db.add(wallet)
    db.flush()
    db.refresh(wallet)
    return wallet


def get_user_wallets(
    db: Session,
    user_id: str,
) -> list[Wallet]:
    return (
        db.query(Wallet)
        .filter(Wallet.user_id == uuid.UUID(user_id))
        .all()
    )


def get_wallet_by_id(
    db: Session,
    wallet_id: str,
) -> Wallet | None:
    return (
        db.query(Wallet)
        .filter(Wallet.id == uuid.UUID(wallet_id))
        .first()
    )