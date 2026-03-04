import uuid

from sqlalchemy.orm import Session

from app.models.risk import RiskLog


def log_risk_event(
    db: Session,
    user_id: str,
    transaction_id: str | None,
    risk_score: float,
    decision: str,
) -> RiskLog:
    risk_log = RiskLog(
        user_id=uuid.UUID(user_id),
        transaction_id=uuid.UUID(transaction_id) if transaction_id is not None else None,
        risk_score=risk_score,
        decision=decision,
    )
    db.add(risk_log)
    db.flush()
    db.refresh(risk_log)
    return risk_log