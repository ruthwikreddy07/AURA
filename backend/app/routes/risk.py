from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import risk_service

router = APIRouter()


class LogRiskRequest(BaseModel):
    user_id: str
    transaction_id: str | None = None
    risk_score: float
    decision: str


class RiskLogResponse(BaseModel):
    id: str
    user_id: str
    transaction_id: str | None
    risk_score: float
    decision: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/log", response_model=RiskLogResponse, status_code=status.HTTP_201_CREATED)
def log_risk(payload: LogRiskRequest, db: Session = Depends(get_db)):
    try:
        risk_log = risk_service.log_risk_event(
            db=db,
            user_id=payload.user_id,
            transaction_id=payload.transaction_id,
            risk_score=payload.risk_score,
            decision=payload.decision,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return RiskLogResponse(
        id=str(risk_log.id),
        user_id=str(risk_log.user_id),
        transaction_id=str(risk_log.transaction_id) if risk_log.transaction_id is not None else None,
        risk_score=risk_log.risk_score,
        decision=risk_log.decision,
        created_at=risk_log.created_at,
    )

@router.get("/logs/{user_id}", response_model=list[RiskLogResponse])
def get_risk_logs(user_id: str, db: Session = Depends(get_db)):
    from app.models.risk import RiskLog
    import uuid
    logs = db.query(RiskLog).filter(RiskLog.user_id == uuid.UUID(user_id)).order_by(RiskLog.created_at.desc()).limit(20).all()
    return [
        RiskLogResponse(
            id=str(lg.id),
            user_id=str(lg.user_id),
            transaction_id=str(lg.transaction_id) if lg.transaction_id is not None else None,
            risk_score=lg.risk_score,
            decision=lg.decision,
            created_at=lg.created_at,
        )
        for lg in logs
    ]