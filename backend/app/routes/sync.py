from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import sync_service

router = APIRouter()


class EnqueueSyncRequest(BaseModel):
    token_id: str
    user_id: str


class SyncQueueResponse(BaseModel):
    id: str
    token_id: str
    user_id: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProcessSyncResponse(BaseModel):
    token_id: str
    success: bool


@router.post("/enqueue", response_model=SyncQueueResponse, status_code=status.HTTP_201_CREATED)
def enqueue_token(payload: EnqueueSyncRequest, db: Session = Depends(get_db)):
    try:
        entry = sync_service.enqueue_token_for_sync(
            db=db,
            token_id=payload.token_id,
            user_id=payload.user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SyncQueueResponse(
        id=str(entry.id),
        token_id=str(entry.token_id),
        user_id=str(entry.user_id),
        status=entry.status,
        created_at=entry.created_at,
    )


@router.post("/process/{token_id}", response_model=ProcessSyncResponse)
def process_sync(token_id: str, db: Session = Depends(get_db)):
    try:
        success = sync_service.process_sync_token(db=db, token_id=token_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Token '{token_id}' already redeemed or invalid",
        )
    return ProcessSyncResponse(token_id=token_id, success=True)