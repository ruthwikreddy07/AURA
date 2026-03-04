from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import transaction_service

router = APIRouter()


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
    token_id: str
    mode: str
    risk_score: float
    status: str
    txn_hash: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: CreateTransactionRequest, db: Session = Depends(get_db)):
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
def get_user_transactions(user_id: str, db: Session = Depends(get_db)):
    try:
        txns = transaction_service.get_user_transactions(db=db, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return [
        TransactionResponse(
            id=str(t.id),
            sender_id=str(t.sender_id),
            receiver_id=str(t.receiver_id),
            token_id=str(t.token_id),
            mode=t.mode,
            risk_score=t.risk_score,
            status=t.status,
            txn_hash=t.txn_hash,
            created_at=t.created_at,
        )
        for t in txns
    ]