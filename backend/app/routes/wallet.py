from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services import wallet_service
from app.services.auth_service import verify_transaction_pin

router = APIRouter()


class CreateWalletRequest(BaseModel):
    user_id: str
    wallet_type: str


class WalletResponse(BaseModel):
    id: str
    user_id: str
    wallet_type: str
    balance: Decimal

    model_config = {"from_attributes": True}


@router.post("/create", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
def create_wallet(payload: CreateWalletRequest, db: Session = Depends(get_db)):
    try:
        wallet = wallet_service.create_wallet(
            db=db,
            user_id=payload.user_id,
            wallet_type=payload.wallet_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return WalletResponse(
        id=str(wallet.id),
        user_id=str(wallet.user_id),
        wallet_type=wallet.wallet_type,
        balance=wallet.balance,
    )


@router.get("/user/{user_id}", response_model=list[WalletResponse])
def get_user_wallets(user_id: str, db: Session = Depends(get_db)):
    try:
        wallets = wallet_service.get_user_wallets(db=db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return [
        WalletResponse(
            id=str(w.id),
            user_id=str(w.user_id),
            wallet_type=w.wallet_type,
            balance=w.balance,
        )
        for w in wallets
    ]


class FundWalletRequest(BaseModel):
    wallet_id: str
    amount: float
    bank_account_id: str  # Simulated funding source
    pin: str  # Verify tx pin


@router.post("/fund", response_model=WalletResponse)
def fund_wallet(
    payload: FundWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify transaction PIN before funding
    if not verify_transaction_pin(current_user, payload.pin):
        raise HTTPException(status_code=403, detail="Invalid transaction PIN")
    try:
        wallet = wallet_service.fund_wallet(db, payload.wallet_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return WalletResponse(
        id=str(wallet.id),
        user_id=str(wallet.user_id),
        wallet_type=wallet.wallet_type,
        balance=wallet.balance,
    )


class WithdrawWalletRequest(BaseModel):
    wallet_id: str
    amount: float
    bank_account_id: str
    pin: str


@router.post("/withdraw", response_model=WalletResponse)
def withdraw_wallet(
    payload: WithdrawWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify transaction PIN before withdrawal
    if not verify_transaction_pin(current_user, payload.pin):
        raise HTTPException(status_code=403, detail="Invalid transaction PIN")
    try:
        wallet = wallet_service.withdraw_wallet(db, payload.wallet_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return WalletResponse(
        id=str(wallet.id),
        user_id=str(wallet.user_id),
        wallet_type=wallet.wallet_type,
        balance=wallet.balance,
    )