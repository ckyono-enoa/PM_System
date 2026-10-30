"""Shared test setup: a throwaway database, and a rolled-back transaction per test."""

import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import Session

from app.core.config import get_settings

BACKEND_DIR = Path(__file__).parent.parent


def _url_for_database(name: str) -> URL:
    """The configured database address, pointed at a different database on the same server."""
    return make_url(get_settings().database_url).set(database=name)


def create_throwaway_database(name: str) -> None:
    """Create an empty database called `name`, replacing any left over from a failed run."""
    admin = create_engine(_url_for_database("postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)'))
        connection.execute(text(f'CREATE DATABASE "{name}"'))
    admin.dispose()


def drop_throwaway_database(name: str) -> None:
    admin = create_engine(_url_for_database("postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        connection.execute(text(f'DROP DATABASE IF EXISTS "{name}" WITH (FORCE)'))
    admin.dispose()


def alembic_config(database_url: URL) -> Config:
    """An Alembic setup that runs against `database_url` instead of the development database."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    # Alembic's settings file treats % specially, so double any in the address.
    url = database_url.render_as_string(hide_password=False).replace("%", "%%")
    config.set_main_option("sqlalchemy.url", url)
    return config


@pytest.fixture(scope="session")
def test_engine() -> Iterator[Engine]:
    """A test database with every migration applied, built once per test run."""
    name = f"pm_system_test_{uuid.uuid4().hex[:8]}"
    create_throwaway_database(name)
    url = _url_for_database(name)
    command.upgrade(alembic_config(url), "head")
    engine = create_engine(url)
    yield engine
    engine.dispose()
    drop_throwaway_database(name)


@pytest.fixture
def db(test_engine: Engine) -> Iterator[Session]:
    """A database session whose changes are all undone when the test ends.

    The test can call `commit()` freely: it only commits to a savepoint inside an
    outer transaction that is rolled back, so no test sees another test's data.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield session
    session.close()
    transaction.rollback()
    connection.close()
