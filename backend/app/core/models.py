"""The base class and shared columns for every database table."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """The base class every table model inherits from."""


class BaseModelMixin:
    """Columns every table has: `id`, `created_at`, and `updated_at`.

    Add it to a table model next to `Base`, for example `class Item(Base, BaseModelMixin)`.
    Times are stored in UTC.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
