from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import analytics_service

router = APIRouter()


@router.get("/monthly-volume", response_model=list[dict])
def monthly_volume(db: Session = Depends(get_db)):
    return analytics_service.get_monthly_transaction_volume(db=db)


@router.get("/mode-distribution", response_model=list[dict])
def mode_distribution(db: Session = Depends(get_db)):
    return analytics_service.get_mode_distribution(db=db)
@router.get("/fraud-attempts", response_model=list[dict])
def fraud_attempts(db: Session = Depends(get_db)):
    return analytics_service.get_fraud_attempts(db=db)


@router.get("/risk-distribution", response_model=list[dict])
def risk_distribution(db: Session = Depends(get_db)):
    return analytics_service.get_risk_distribution(db=db)