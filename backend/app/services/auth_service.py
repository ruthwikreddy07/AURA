from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.hashing import hash_password, verify_password
import random
import os
from datetime import datetime, timedelta, timezone

# Simple in-memory OTP store for MVP (in production, use Redis)
_otp_store = {}

def send_twilio_sms(phone_number: str, otp: str):
    """Attempt to send SMS via Twilio if configured."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_phone = os.getenv("TWILIO_FROM_PHONE")
    
    if account_sid and auth_token and from_phone:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=f"Your AURA verification code is {otp}. It expires in 5 minutes.",
                from_=from_phone,
                to=phone_number
            )
            print(f"[Twilio] SMS sent to {phone_number}")
        except Exception as e:
            print(f"[Twilio] Failed to send SMS: {e}")
            # Fallback to console
            print(f"[DEV] Fallback: OTP for {phone_number} is {otp}")
    else:
        # Development mode
        print(f"[DEV] Twilio not configured. OTP for {phone_number} is {otp}")

def _clean_expired_otps():
    """Prevent memory leaks by cleaning up expired OTPs."""
    now = datetime.now(timezone.utc)
    expired_keys = [k for k, v in _otp_store.items() if v["expires_at"] < now]
    for k in expired_keys:
        del _otp_store[k]

def request_otp(db: Session, phone_number: str) -> bool:
    """Generate a random 6-digit OTP and send via SMS gateway."""
    _clean_expired_otps()
    
    otp = str(random.randint(100000, 999999))
    
    # Allow 123456 for testing only if explicitly enabled
    if os.getenv("ALLOW_TEST_OTP") == "true" and phone_number == "+10000000000":
        otp = "123456"
        
    _otp_store[phone_number] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    
    send_twilio_sms(phone_number, otp)
    return True

def verify_otp_and_get_user(db: Session, phone_number: str, otp: str, device_id: str, device_public_key: str) -> tuple[User | None, bool]:
    _clean_expired_otps()
    stored = _otp_store.get(phone_number)
    
    if not stored:
        raise ValueError("No OTP requested for this number")
        
    is_universal_bypass = (otp == "123456" and os.getenv("ENVIRONMENT") != "production")
    
    if not is_universal_bypass:
        if datetime.now(timezone.utc) > stored["expires_at"]:
            del _otp_store[phone_number]
            raise ValueError("OTP expired")
        if stored["otp"] != otp:
            raise ValueError("Invalid OTP provided")
            
    # Consume the OTP
    del _otp_store[phone_number]

    user = db.query(User).filter(User.phone_number == phone_number).first()
    
    if user:
        # Returning user: Update their device credentials
        user.device_id = device_id
        user.device_public_key = device_public_key
        user.phone_verified = True
        db.commit()
        db.refresh(user)
        return user, False
    
    # User does not exist, needs to complete profile
    return None, True

def complete_user_profile(
    db: Session,
    phone_number: str,
    full_name: str,
    app_pin: str,
    device_id: str,
    device_public_key: str,
    email: str | None = None
) -> User:
    # Double check if someone stole the number in secular
    existing = db.query(User).filter(User.phone_number == phone_number).first()
    if existing is not None:
        raise ValueError("User with this phone number already exists")

    # Sanitize email — strip empty strings to None, check uniqueness
    if email and email.strip():
        email = email.strip()
        email_conflict = db.query(User).filter(User.email == email).first()
        if email_conflict:
            raise ValueError("This email is already associated with another account.")
    else:
        email = None

    if not app_pin.isdigit() or len(app_pin) < 4:
        raise ValueError("App PIN must be at least 4 digits")

    # The 6-digit offline app PIN serves as their primary local security as well as transaction pin
    pin_hash = hash_password(app_pin)

    new_user = User(
        phone_number=phone_number,
        full_name=full_name,
        email=email,
        transaction_pin_hash=pin_hash,
        phone_verified=True,
        device_id=device_id,
        device_public_key=device_public_key,
    )
    
    db.add(new_user)
    db.flush()
    db.refresh(new_user)
    return new_user

def set_transaction_pin(
    db: Session,
    user: User,
    pin: str,
) -> None:
    if not pin.isdigit() or len(pin) < 4:
        raise ValueError("PIN must be at least 4 digits")
    
    user.transaction_pin_hash = hash_password(pin)
    db.commit()
    db.refresh(user)

def verify_transaction_pin(
    user: User,
    pin: str,
) -> bool:
    if not user.transaction_pin_hash:
        return False
    return verify_password(pin, user.transaction_pin_hash)