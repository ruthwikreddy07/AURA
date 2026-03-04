from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import wallet_service

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