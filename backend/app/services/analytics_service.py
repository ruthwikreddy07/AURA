from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.risk import RiskLog

def get_monthly_transaction_volume(db: Session) -> list[dict]:
    rows = (
        db.query(
            func.date_trunc("month", Transaction.created_at).label("month"),
            func.count(Transaction.id).label("total"),
        )
        .group_by(func.date_trunc("month", Transaction.created_at))
        .order_by(func.date_trunc("month", Transaction.created_at))
        .all()
    )
    return [{"month": row.month.isoformat(), "total": row.total} for row in rows]


def get_mode_distribution(db: Session) -> list[dict]:
    rows = (
        db.query(
            Transaction.mode.label("mode"),
            func.count(Transaction.id).label("count"),
        )
        .group_by(Transaction.mode)
        .order_by(func.count(Transaction.id).desc())
        .all()
    )
    return [{"mode": row.mode, "count": row.count} for row in rows]
def get_fraud_attempts(db: Session) -> list[dict]:
    rows = (
        db.query(
            RiskLog.decision.label("decision"),
            func.count(RiskLog.id).label("count"),
        )
        .group_by(RiskLog.decision)
        .order_by(func.count(RiskLog.id).desc())
        .all()
    )

    return [{"decision": row.decision, "count": row.count} for row in rows]

def get_risk_distribution(db: Session) -> list[dict]:
    rows = (
        db.query(
            func.round(RiskLog.risk_score, 1).label("risk_level"),
            func.count(RiskLog.id).label("count"),
        )
        .group_by(func.round(RiskLog.risk_score, 1))
        .order_by(func.round(RiskLog.risk_score, 1))
        .all()
    )

    return [{"risk_level": row.risk_level, "count": row.count} for row in rows]