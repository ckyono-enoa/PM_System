"""The database connection, and one database session per request."""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    """Return the database engine, created once when first asked for.

    Creating it does not connect. The first query does, so the app and its tests
    can start without a database as long as they do not touch one.
    """
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_db() -> Iterator[Session]:
    """Give a request its own database session, to use as a FastAPI dependency.

    Everything the request writes is one transaction. It is saved when the request
    finishes normally and undone if the request raises an error.
    """
    with sessionmaker(bind=get_engine(), expire_on_commit=False)() as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
