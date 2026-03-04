from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import token_service

router = APIRouter()


class IssueTokenRequest(BaseModel):
    wallet_id: str
    token_value: float
    expires_at: datetime


class TokenResponse(BaseModel):
    id: str
    wallet_id: str
    token_value: Decimal
    status: str
    sync_status: str
    nonce: int
    hash: str
    issued_at: datetime
    expires_at: datetime
    spent_at: datetime | None

    model_config = {"from_attributes": True}


@router.post("/issue", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def issue_token(payload: IssueTokenRequest, db: Session = Depends(get_db)):
    try:
        token = token_service.issue_token(
            db=db,
            wallet_id=payload.wallet_id,
            token_value=payload.token_value,
            expires_at=payload.expires_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return TokenResponse(
        id=str(token.id),
        wallet_id=str(token.wallet_id),
        token_value=token.token_value,
        status=token.status,
        sync_status=token.sync_status,
        nonce=token.nonce,
        hash=token.hash,
        issued_at=token.issued_at,
        expires_at=token.expires_at,
        spent_at=token.spent_at,
    )


@router.get("/wallet/{wallet_id}", response_model=list[TokenResponse])
def get_wallet_tokens(wallet_id: str, db: Session = Depends(get_db)):
    try:
        tokens = token_service.get_wallet_tokens(db=db, wallet_id=wallet_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return [
        TokenResponse(
            id=str(t.id),
            wallet_id=str(t.wallet_id),
            token_value=t.token_value,
            status=t.status,
            sync_status=t.sync_status,
            nonce=t.nonce,
            hash=t.hash,
            issued_at=t.issued_at,
            expires_at=t.expires_at,
            spent_at=t.spent_at,
        )
        for t in tokens
    ]