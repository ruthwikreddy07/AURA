from datetime import datetime

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
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


class ReconcileBatchItem(BaseModel):
    outbox_id: str
    status: str
    error: str | None = None
    synced_at: str | None = None


class ReconcileRequest(BaseModel):
    user_id: str
    device_timestamp: str
    sync_batch: list[ReconcileBatchItem]



@router.post("/enqueue", response_model=SyncQueueResponse, status_code=status.HTTP_201_CREATED)
def enqueue_token(payload: EnqueueSyncRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
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


@router.get("/queue/{user_id}", response_model=list[dict])
def get_queue(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return sync_service.get_user_queue(db=db, user_id=user_id)


@router.post("/process/{token_id}", response_model=ProcessSyncResponse)
def process_sync(token_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Ownership check: verify the token in the sync queue belongs to this user
    from app.models.sync import SyncQueue
    import uuid
    try:
        t_uuid = uuid.UUID(token_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token ID")

    queue_entry = db.query(SyncQueue).filter(SyncQueue.token_id == t_uuid).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Token not found in sync queue")
    if str(queue_entry.user_id) != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to sync this token")

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


@router.post("/reconcile")
def reconcile_sync_batch(payload: ReconcileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    # Simply log or process the reconciled batch.
    # In a full implementation, this updates the server-side sync state ledger.
    return {"reconciled": True, "processed": len(payload.sync_batch)}