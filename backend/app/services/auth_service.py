from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.hashing import hash_password, verify_password


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: str,
) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise ValueError(f"User with email '{email}' already exists")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user