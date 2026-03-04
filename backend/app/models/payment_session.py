import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# SECURITY: ephemeral session key for encrypted token transfer
class PaymentSession(Base):
    __tablename__ = "payment_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )

    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    receiver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    mode: Mapped[str] = mapped_column(String(32), nullable=False)

    session_key: Mapped[str] = mapped_column(String(512), nullable=False)

    status: Mapped[str] = mapped_column(String(32), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    nullable=False,
    )
    # SECURITY: motion handshake proof from devices
    sender_motion_hash: Mapped[str | None] = mapped_column(
    String(128),
    nullable=True,
    )

    receiver_motion_hash: Mapped[str | None] = mapped_column(
    String(128),
    nullable=True,
    )

    # SECURITY: prevents relay attacks by requiring physical motion match
    motion_verified: Mapped[bool] = mapped_column(
    default=False,
    )