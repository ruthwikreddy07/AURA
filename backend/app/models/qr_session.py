import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)

def get_expiration():
    return datetime.now(timezone.utc) + timedelta(minutes=2)

class QRSession(Base):
    __tablename__ = "qr_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # user_id is null until the mobile app scans and approves it
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    status = Column(String(32), default="pending", nullable=False) # pending, approved
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), default=get_expiration, nullable=False)
