import uuid

from sqlalchemy import Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserModePreferences(Base):
    __tablename__ = "user_mode_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    ble_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    qr_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    sound_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    light_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    nfc_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    manual_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")