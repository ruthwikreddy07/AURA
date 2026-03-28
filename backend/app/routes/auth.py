from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import auth_service
from app.utils.jwt import create_access_token
from app.deps import get_current_user
from app.models.user import User

router = APIRouter()

# --- OTP Flow Models ---

class RequestOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str
    device_id: str
    device_public_key: str

class CompleteProfileRequest(BaseModel):
    phone_number: str
    full_name: str
    app_pin: str
    device_id: str
    device_public_key: str
    email: EmailStr | None = None


class VerifyOTPResponse(BaseModel):
    is_new_user: bool
    access_token: str | None = None
    user_id: str | None = None

class AuthResponse(BaseModel):
    id: str
    email: str | None
    full_name: str
    phone_number: str | None
    is_active: bool
    access_token: str

    model_config = {"from_attributes": True}

# --- OTP Flow Endpoints ---

@router.post("/request-otp")
def request_otp(payload: RequestOTPRequest, db: Session = Depends(get_db)):
    success = auth_service.request_otp(db, payload.phone_number)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    return {"status": "success", "message": "OTP sent successfully"}


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    try:
        user, is_new_user = auth_service.verify_otp_and_get_user(
            db=db,
            phone_number=payload.phone_number,
            otp=payload.otp,
            device_id=payload.device_id,
            device_public_key=payload.device_public_key
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    if is_new_user:
        # Require them to call /complete-profile next
        return VerifyOTPResponse(is_new_user=True)
    
    # Returning user, issue token immediately
    token = create_access_token(user_id=str(user.id), email=user.email or user.phone_number)
    
    return VerifyOTPResponse(
        is_new_user=False,
        access_token=token,
        user_id=str(user.id)
    )


@router.post("/complete-profile", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def complete_profile(payload: CompleteProfileRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.complete_user_profile(
            db=db,
            phone_number=payload.phone_number,
            full_name=payload.full_name,
            app_pin=payload.app_pin,
            device_id=payload.device_id,
            device_public_key=payload.device_public_key,
            email=payload.email
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    token = create_access_token(user_id=str(user.id), email=user.email or user.phone_number)

    return AuthResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        is_active=user.is_active,
        access_token=token,
    )

# --- Legacy Password Routes (Left intact to prevent breaking existing mobile/web sessions during switch, but shouldn't be used for new signups) ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    from app.services.auth_service import verify_password
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user_id=str(user.id), email=user.email)
    return AuthResponse(
        id=str(user.id), email=user.email, full_name=user.full_name, phone_number=user.phone_number,
        is_active=user.is_active, access_token=token,
    )

# --- Profile Routes ---

class PinRequest(BaseModel):
    pin: str

@router.post("/set-pin")
def set_pin(
    payload: PinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        auth_service.set_transaction_pin(db, current_user, payload.pin)
        return {"status": "success", "message": "Transaction PIN set successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-pin")
def verify_pin(
    payload: PinRequest,
    current_user: User = Depends(get_current_user),
):
    is_valid = auth_service.verify_transaction_pin(current_user, payload.pin)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Transaction PIN")
    return {"status": "success"}

class ProfileResponse(BaseModel):
    id: str
    email: str | None
    full_name: str
    is_active: bool
    phone_number: str | None
    phone_verified: bool
    kyc_status: str
    app_lock_enabled: bool
    has_transaction_pin: bool

    model_config = {"from_attributes": True}

@router.get("/me", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        phone_number=current_user.phone_number,
        phone_verified=current_user.phone_verified,
        kyc_status=current_user.kyc_status,
        app_lock_enabled=current_user.app_lock_enabled,
        has_transaction_pin=current_user.transaction_pin_hash is not None,
    )

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    phone_number: str | None = None
    app_lock_enabled: bool | None = None
    kyc_status: str | None = None

@router.put("/me", response_model=ProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.app_lock_enabled is not None:
        current_user.app_lock_enabled = payload.app_lock_enabled
    if payload.kyc_status is not None:
        current_user.kyc_status = payload.kyc_status
    db.commit()
    db.refresh(current_user)
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        phone_number=current_user.phone_number,
        phone_verified=current_user.phone_verified,
        kyc_status=current_user.kyc_status,
        app_lock_enabled=current_user.app_lock_enabled,
        has_transaction_pin=current_user.transaction_pin_hash is not None,
    )

# --- QR Login Flow (Phase 3) ---

from app.models.qr_session import QRSession
from datetime import datetime, timezone

class QRGenerateResponse(BaseModel):
    session_id: str
    expires_at: datetime

@router.post("/qr/generate", response_model=QRGenerateResponse)
def qr_generate(db: Session = Depends(get_db)):
    session = QRSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return QRGenerateResponse(
        session_id=str(session.id),
        expires_at=session.expires_at
    )

class QRStatusResponse(BaseModel):
    status: str
    access_token: str | None = None
    user_id: str | None = None

@router.get("/qr/status/{session_id}", response_model=QRStatusResponse)
def qr_status(session_id: str, db: Session = Depends(get_db)):
    session = db.query(QRSession).filter(QRSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.expires_at < datetime.now(timezone.utc):
        session.status = "expired"
        db.commit()
        return QRStatusResponse(status="expired")
        
    if session.status == "approved" and session.user_id:
        # Generate token for the web client
        user = db.query(User).filter(User.id == session.user_id).first()
        token = create_access_token(user_id=str(user.id), email=user.email or user.phone_number)
        return QRStatusResponse(
            status="approved",
            access_token=token,
            user_id=str(user.id)
        )
        
    return QRStatusResponse(status=session.status)


class QRApproveRequest(BaseModel):
    session_id: str
    signature: str | None = None

@router.post("/qr/approve")
def qr_approve(
    payload: QRApproveRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(QRSession).filter(QRSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Session expired")
        
    if session.status != "pending":
        raise HTTPException(status_code=400, detail=f"Session is already {session.status}")

    # For AURA MVP, if the mobile app hits this endpoint with a valid Bearer token, we trust it.
    session.status = "approved"
    session.user_id = current_user.id
    db.commit()
    
    return {"status": "success", "message": "Login approved"}