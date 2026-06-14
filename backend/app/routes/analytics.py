from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin, get_current_user
from app.models.user import User
from app.services import analytics_service

router = APIRouter()


@router.get("/monthly-volume", response_model=list[dict])
def monthly_volume(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return analytics_service.get_monthly_transaction_volume(db=db)


@router.get("/mode-distribution", response_model=list[dict])
def mode_distribution(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return analytics_service.get_mode_distribution(db=db)
@router.get("/fraud-attempts", response_model=list[dict])
def fraud_attempts(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return analytics_service.get_fraud_attempts(db=db)


@router.get("/risk-distribution", response_model=list[dict])
def risk_distribution(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return analytics_service.get_risk_distribution(db=db)


@router.get("/me")
def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personal transaction insights and metrics for the logged-in user.
    """
    from app.services import transaction_service
    txs = transaction_service.get_user_transactions(db, str(current_user.id), limit=100)
    
    total_volume = sum(tx["amount"] for tx in txs)
    avg_per_day = total_volume / 7.0 if txs else 0.0
    total_tx_count = len(txs)
    
    # Mode breakdown
    modes = {}
    for tx in txs:
        m = tx["mode"]
        modes[m] = modes.get(m, 0) + 1
        
    return {
        "total_volume": total_volume,
        "avg_per_day": avg_per_day,
        "total_tx_count": total_tx_count,
        "modes": modes,
        "txs_count": total_tx_count
    }