import uuid
from datetime import UTC, datetime

from sqlalchemy import Text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.core.models import BaseModelMixin
from app.core.org import get_current_org, get_current_org_id, select_in_org
from app.features.organizations.models import Organization


def test_seeded_organization_is_e_noa(db: Session) -> None:
    org = get_current_org(db)

    assert org.name == "E Noa Corporation"
    assert org.item_prefix == "PM"
    assert org.time_zone == "Pacific/Honolulu"
    assert org.next_item_number == 1
    assert org.allowed_domains == []
    assert org.attachment_max_mb == 25
    assert "passwords" in org.sensitive_warning_text


def test_current_org_id_is_the_seeded_organization(db: Session) -> None:
    assert get_current_org_id(db) == get_current_org(db).id


def test_base_columns_are_filled_in(db: Session) -> None:
    org = get_current_org(db)

    assert isinstance(org.id, uuid.UUID)
    assert org.created_at.tzinfo is not None
    assert org.created_at <= datetime.now(UTC)
    assert org.updated_at.tzinfo is not None


def test_new_rows_get_an_id_without_the_caller_giving_one(db: Session) -> None:
    other = Organization(name="Other Co", item_prefix="OC")
    db.add(other)
    db.commit()

    assert isinstance(other.id, uuid.UUID)
    assert other.next_item_number == 1


class _TestBase(DeclarativeBase):
    """Keeps the stand-in table below out of the app's real table list."""


class _Widget(_TestBase, BaseModelMixin):
    """Stand-in for a business table, which will have an `org_id` column."""

    __tablename__ = "test_widgets"

    org_id: Mapped[uuid.UUID]
    label: Mapped[str] = mapped_column(Text)


def test_select_in_org_only_returns_rows_for_that_organization(db: Session) -> None:
    # The table only exists inside this test's transaction, which is rolled back.
    _TestBase.metadata.create_all(db.connection())
    ours = get_current_org_id(db)
    other = Organization(name="Other Co", item_prefix="OC")
    db.add(other)
    db.flush()
    db.add_all(
        [
            _Widget(org_id=ours, label="ours"),
            _Widget(org_id=other.id, label="theirs"),
        ]
    )
    db.flush()

    labels = [widget.label for widget in db.execute(select_in_org(_Widget, ours)).scalars()]

    assert labels == ["ours"]
