from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from app.database import get_db
from app.deps import get_current_user, get_current_admin
from app.models.user import User
from app.models.dispute import Dispute
from app.models.transaction import Transaction

router = APIRouter()

class FileDisputeRequest(BaseModel):
    transaction_id: str
    reason: str

class DisputeResponse(BaseModel):
    id: str
    transaction_id: str
    reason: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.post("/file", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def file_dispute(
    payload: FileDisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        tx_uuid = uuid.UUID(payload.transaction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid transaction ID")

    # Verify transaction exists and user is part of it
    txn = db.query(Transaction).filter(Transaction.id == tx_uuid).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if txn.sender_id != current_user.id and txn.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to dispute this transaction")

    # Check if a dispute already exists
    existing = db.query(Dispute).filter(
        Dispute.transaction_id == tx_uuid,
        Dispute.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="You have already filed a dispute for this transaction")

    dispute = Dispute(
        user_id=current_user.id,
        transaction_id=tx_uuid,
        reason=payload.reason,
        status="open"
    )
    
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    
    # In a full implementation, you would also notify admins via email or admin dashboard alert here.

    return DisputeResponse(
        id=str(dispute.id),
        transaction_id=str(dispute.transaction_id),
        reason=dispute.reason,
        status=dispute.status,
        created_at=dispute.created_at,
        updated_at=dispute.updated_at
    )


@router.get("/my", response_model=list[DisputeResponse])
def get_my_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disputes = db.query(Dispute).filter(Dispute.user_id == current_user.id).all()
    
    return [
        DisputeResponse(
            id=str(d.id),
            transaction_id=str(d.transaction_id),
            reason=d.reason,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at
        ) for d in disputes
    ]


class ResolveDisputeRequest(BaseModel):
    action: str  # "resolve", "reject", "chargeback"
    resolution_notes: str | None = None

@router.post("/admin/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute_admin(
    dispute_id: str,
    payload: ResolveDisputeRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        d_uuid = uuid.UUID(dispute_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid dispute ID")

    dispute = db.query(Dispute).filter(Dispute.id == d_uuid).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    # Prevent re-resolving an already closed dispute
    if dispute.status in ("resolved", "rejected", "resolved_chargeback"):
        raise HTTPException(
            status_code=409,
            detail=f"Dispute is already closed with status '{dispute.status}'"
        )

    if payload.action == "reject":
        dispute.status = "rejected"
    elif payload.action == "resolve":
        dispute.status = "resolved"
    elif payload.action == "chargeback":
        dispute.status = "resolved_chargeback"
        # Actual chargeback logic would reverse the transaction here.
        # This involves refunding the token back to the sender's wallet, or deducting from receiver's wallet.
        # Since AURA is an offline token system, chargebacks might require placing a hold on the receiver's connected bank account.
        
        txn = db.query(Transaction).filter(Transaction.id == dispute.transaction_id).first()
        if txn:
            txn.status = "chargeback_issued"
            
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    dispute.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dispute)

    return DisputeResponse(
        id=str(dispute.id),
        transaction_id=str(dispute.transaction_id),
        reason=dispute.reason,
        status=dispute.status,
        created_at=dispute.created_at,
        updated_at=dispute.updated_at
    )
