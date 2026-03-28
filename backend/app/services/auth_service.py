from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.hashing import hash_password, verify_password

def request_otp(db: Session, phone_number: str) -> bool:
    # In a real app, this would integrate with an SMS gateway (Twilio, AWS SNS, Msg91).
    # For now, we mock success. The OTP is statically '123456' for verification.
    return True

def verify_otp_and_get_user(db: Session, phone_number: str, otp: str, device_id: str, device_public_key: str) -> tuple[User | None, bool]:
    # Hardcoded OTP for hackathon / development
    if otp != "123456":
        raise ValueError("Invalid OTP provided")

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