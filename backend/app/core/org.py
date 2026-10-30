"""Helpers that scope every query to the current organization.

Every business table has an `org_id` column (ADR 0006). Queries never read the
organization from the request. They get it from here.
"""

import uuid
from typing import Any

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.features.organizations.models import Organization


def get_current_org(db: Session) -> Organization:
    """Return the organization the current user belongs to.

    Until sign-in exists (Phase 1) there is exactly one organization, E Noa, so that
    is the one returned. Once users can sign in, this will return the organization of
    the signed-in user instead. Callers will not change.
    """
    return db.execute(select(Organization)).scalar_one()


def get_current_org_id(db: Session) -> uuid.UUID:
    """Return the ID of the current organization."""
    return get_current_org(db).id


def select_in_org(model: Any, org_id: uuid.UUID) -> Select[Any]:
    """Start a query for `model` rows that belong to the organization `org_id`.

    Use this instead of `select(model)` for any table that has an `org_id` column,
    then add more filters to the result as needed.
    """
    return select(model).where(model.org_id == org_id)
