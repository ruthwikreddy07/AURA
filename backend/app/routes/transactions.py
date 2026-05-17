from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.token import Token
from app.services import transaction_service

router = APIRouter()

# ── Transaction Limits ──
DAILY_LIMIT = 200000    # ₹2,00,000 per day
MONTHLY_LIMIT = 1000000  # ₹10,00,000 per month


class CreateTransactionRequest(BaseModel):
    sender_id: str
    receiver_id: str
    token_id: str
    mode: str
    risk_score: float


class TransactionResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    token_id: str
    amount: Optional[float] = None
    mode: str
    risk_score: float
    status: str
    txn_hash: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


def _check_transaction_limits(db: Session, sender_id: str, amount: float):
    """Enforce daily and monthly transaction caps."""
    import uuid
    from datetime import timezone
    now = datetime.now(timezone.utc)
    uid = uuid.UUID(sender_id)

    # Daily total
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    daily_total = (
        db.query(func.coalesce(func.sum(Token.token_value), 0))
        .join(Transaction, Transaction.token_id == Token.id)
        .filter(Transaction.sender_id == uid, Transaction.created_at >= day_start)
        .scalar()
    )
    if float(daily_total) + amount > DAILY_LIMIT:
        raise ValueError(f"Daily transaction limit exceeded (₹{DAILY_LIMIT:,}). Today's total: ₹{float(daily_total):,.0f}")

    # Monthly total
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_total = (
        db.query(func.coalesce(func.sum(Token.token_value), 0))
        .join(Transaction, Transaction.token_id == Token.id)
        .filter(Transaction.sender_id == uid, Transaction.created_at >= month_start)
        .scalar()
    )
    if float(monthly_total) + amount > MONTHLY_LIMIT:
        raise ValueError(f"Monthly transaction limit exceeded (₹{MONTHLY_LIMIT:,}). This month: ₹{float(monthly_total):,.0f}")


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: CreateTransactionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth check: caller must be sender or receiver
    if str(current_user.id) not in (payload.sender_id, payload.receiver_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create this transaction")

    # Check limits before creating
    import uuid
    try:
        token_uuid = uuid.UUID(payload.token_id)
    except ValueError:
        token_uuid = None
        
    if token_uuid:
        token_obj = db.query(Token).filter(Token.id == token_uuid).first()
        if token_obj:
            try:
                _check_transaction_limits(db, payload.sender_id, float(token_obj.token_value))
            except ValueError as limit_err:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(limit_err))


    try:
        txn = transaction_service.create_transaction(
            db=db,
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
            token_id=payload.token_id,
            mode=payload.mode,
            risk_score=payload.risk_score,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return TransactionResponse(
        id=str(txn.id),
        sender_id=str(txn.sender_id),
        receiver_id=str(txn.receiver_id),
        token_id=str(txn.token_id),
        mode=txn.mode,
        risk_score=txn.risk_score,
        status=txn.status,
        txn_hash=txn.txn_hash,
        created_at=txn.created_at,
    )


@router.get("/user/{user_id}", response_model=list[TransactionResponse])
def get_user_transactions(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mode: Optional[str] = Query(None, description="Filter by transfer mode (qr, sound, light, ble, nfc)"),
    tx_status: Optional[str] = Query(None, alias="status", description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="From date (ISO 8601)"),
    date_to: Optional[datetime] = Query(None, description="To date (ISO 8601)"),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum amount"),
    search: Optional[str] = Query(None, description="Search by name or txn hash"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    if str(current_user.id) != user_id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these transactions")
        
    try:
        txns = transaction_service.get_user_transactions(
            db=db, user_id=user_id,
            mode=mode, tx_status=tx_status,
            date_from=date_from, date_to=date_to,
            min_amount=min_amount, max_amount=max_amount,
            search=search, limit=limit, offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return [
        TransactionResponse(**txn)
        for txn in txns
    ]