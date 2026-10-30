from collections.abc import Iterator

import pytest
from alembic import command
from sqlalchemy import create_engine, inspect, text

from tests.conftest import (
    _url_for_database,
    alembic_config,
    create_throwaway_database,
    drop_throwaway_database,
)

MIGRATION_DB = "pm_system_migration_test"


@pytest.fixture
def empty_database() -> Iterator[None]:
    """A separate empty database, so undoing migrations cannot disturb the other tests."""
    create_throwaway_database(MIGRATION_DB)
    yield
    drop_throwaway_database(MIGRATION_DB)


def test_migrations_run_from_empty_to_latest_and_back_down_one_step(empty_database: None) -> None:
    url = _url_for_database(MIGRATION_DB)
    config = alembic_config(url)
    engine = create_engine(url)

    assert inspect(engine).get_table_names() == []

    command.upgrade(config, "head")
    assert "organizations" in inspect(engine).get_table_names()
    with engine.connect() as connection:
        assert connection.execute(text("SELECT count(*) FROM organizations")).scalar_one() == 1

    command.downgrade(config, "-1")
    assert "organizations" not in inspect(engine).get_table_names()

    # Going up again proves the downgrade left nothing behind that breaks the upgrade.
    command.upgrade(config, "head")
    assert "organizations" in inspect(engine).get_table_names()

    engine.dispose()
