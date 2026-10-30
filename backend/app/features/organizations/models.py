"""The organizations table: one row per company, and today only E Noa."""

from sqlalchemy import ARRAY, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, BaseModelMixin

DEFAULT_SENSITIVE_WARNING = (
    "Do not put passwords, card numbers, or other sensitive credentials in tickets."
)


class Organization(Base, BaseModelMixin):
    """A company that uses the app. Its settings live here, not in code (ADR 0006)."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(Text)
    # The letters in front of item numbers, for example "PM" in PM-42.
    item_prefix: Mapped[str] = mapped_column(Text)
    # The number the next new item gets. Always changed under a row lock.
    next_item_number: Mapped[int] = mapped_column(Integer, server_default=text("1"))
    time_zone: Mapped[str] = mapped_column(Text, server_default=text("'Pacific/Honolulu'"))
    # Email domains allowed to sign in, for example ["enoa.com"].
    allowed_domains: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default=text("'{}'::text[]")
    )
    attachment_max_mb: Mapped[int] = mapped_column(Integer, server_default=text("25"))
    sensitive_warning_text: Mapped[str] = mapped_column(
        Text, server_default=text(f"'{DEFAULT_SENSITIVE_WARNING}'")
    )
