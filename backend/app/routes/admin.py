"""
Admin-only routes for AURA Command Center.
Secured via get_current_admin dependency — only is_admin=True users can access.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.risk import RiskLog
from app.models.wallet import Wallet
from app.models.token import Token
from app.utils.hashing import verify_password
from app.utils.jwt import create_access_token
from app.deps import get_current_admin

router = APIRouter()


# ═══════════════════════════════════════
# ADMIN LOGIN
# ═══════════════════════════════════════

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    user_id: str
    full_name: str


@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_admin == True).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    
    token = create_access_token(str(user.id), user.email or "", role="admin")
    return AdminLoginResponse(access_token=token, user_id=str(user.id), full_name=user.full_name)


# ═══════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════

class UserSummary(BaseModel):
    id: str
    full_name: str
    email: str | None
    phone_number: str | None
    kyc_status: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/users", response_model=list[UserSummary])
def list_all_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [
        UserSummary(
            id=str(u.id), full_name=u.full_name, email=u.email,
            phone_number=u.phone_number, kyc_status=u.kyc_status,
            is_admin=u.is_admin, created_at=u.created_at,
        )
        for u in users
    ]


class KYCAction(BaseModel):
    user_id: str
    new_status: str  # "verified" or "pending"


@router.post("/kyc-action")
def kyc_action(payload: KYCAction, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    import uuid
    user = db.query(User).filter(User.id == uuid.UUID(payload.user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.kyc_status = payload.new_status
    db.commit()
    return {"message": f"KYC status for {user.full_name} updated to {payload.new_status}."}


# ═══════════════════════════════════════
# FRAUD/RISK COMMAND CENTER
# ═══════════════════════════════════════

class RiskLogSummary(BaseModel):
    id: str
    user_id: str
    user_name: str
    risk_score: float
    decision: str
    created_at: datetime


@router.get("/risk-logs", response_model=list[RiskLogSummary])
def get_all_risk_logs(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(RiskLog, User.full_name).join(User, RiskLog.user_id == User.id).order_by(RiskLog.created_at.desc()).limit(50).all()
    return [
        RiskLogSummary(
            id=str(lg.id), user_id=str(lg.user_id), user_name=name,
            risk_score=lg.risk_score, decision=lg.decision, created_at=lg.created_at,
        )
        for lg, name in logs
    ]


# ═══════════════════════════════════════
# SYSTEM ANALYTICS
# ═══════════════════════════════════════

@router.get("/system-stats")
def system_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.kyc_status == "verified").scalar() or 0
    total_wallet_balance = db.query(func.coalesce(func.sum(Wallet.balance), 0)).scalar()
    total_token_value = db.query(func.coalesce(func.sum(Token.token_value), 0)).scalar()
    active_tokens = db.query(func.count(Token.id)).filter(Token.status == "active").scalar() or 0
    flagged_events = db.query(func.count(RiskLog.id)).filter(RiskLog.risk_score > 0.8).scalar() or 0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "total_wallet_balance": float(total_wallet_balance),
        "total_token_value": float(total_token_value),
        "active_tokens": active_tokens,
        "flagged_events": flagged_events,
    }
